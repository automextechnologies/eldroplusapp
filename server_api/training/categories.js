import { connectDB } from '../_lib/mongodb.js';
import User from '../_lib/models/User.js';
import VideoCategory from '../_lib/models/VideoCategory.js';
import Video from '../_lib/models/Video.js';
import { verifyToken } from '../_lib/auth.js';
import { handleCors } from '../_lib/cors.js';

export const STARTER_CATEGORIES = [
  { name: 'Personal', description: 'Personalised tutorials and routines tailored specifically for you', order: -1 },
  { name: 'Yoga & Mobility', description: 'Gentle stretches, joint mobility, and yoga poses for seniors', order: 1 },
  { name: 'Meditation & Breathwork', description: 'Guided mindfulness, stress relief, and breathing exercises', order: 2 },
  { name: 'Nutrition & Diet', description: 'Healthy eating, protein intake guidance, and hydration tips', order: 3 },
  { name: 'Strength & Balance', description: 'Low-impact muscle strengthening and fall prevention balance drills', order: 4 },
  { name: 'Daily Wellness', description: 'Healthy habits, morning routines, and restful sleep strategies', order: 5 },
];

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  // Ensure fresh responses and prevent proxy/browser caching
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  await connectDB();

  try {
    // 1. GET: List all categories with accurate video counts
    if (req.method === 'GET') {
      // Ensure the built-in "Personal" group always exists
      let personalCat = await VideoCategory.findOne({ name: { $regex: /^personal$/i } });
      if (!personalCat) {
        personalCat = await VideoCategory.create({
          name: 'Personal',
          description: 'Personalised tutorials and routines tailored specifically for you',
          order: -1,
        });
      } else if (personalCat.order !== -1) {
        personalCat.order = -1;
        await personalCat.save();
      }

      let requestingUser = null;
      try {
        const { userId } = verifyToken(req);
        if (userId) requestingUser = await User.findById(userId).lean();
      } catch {
        // Optional auth on GET
      }
      const isAdmin = requestingUser?.role === 'admin';

      const categories = await VideoCategory.find().sort({ order: 1, name: 1 });

      // Calculate video count per category
      const categoriesWithCount = await Promise.all(
        categories.map(async (cat) => {
          const isPersonalGroup = cat.name.trim().toLowerCase() === 'personal';
          const escapedName = cat.name.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          let countQuery;

          if (isAdmin) {
            countQuery = {
              $or: [
                { categoryId: cat._id },
                { category: { $regex: new RegExp(`^${escapedName}$`, 'i') } },
                ...(isPersonalGroup ? [{ isPersonal: true }, { userId: { $ne: null } }] : []),
              ],
              isActive: true,
            };
          } else if (isPersonalGroup) {
            if (!requestingUser) {
              return { ...cat.toObject(), videoCount: 0 };
            }
            countQuery = {
              isActive: true,
              userId: requestingUser._id,
            };
          } else {
            countQuery = {
              $and: [
                {
                  $or: [
                    { categoryId: cat._id },
                    { category: { $regex: new RegExp(`^${escapedName}$`, 'i') } },
                  ],
                },
                {
                  $or: [
                    { userId: null },
                    { userId: { $exists: false } },
                  ],
                },
              ],
              isActive: true,
            };
          }

          const count = await Video.countDocuments(countQuery);
          return {
            ...cat.toObject(),
            videoCount: count,
          };
        })
      );

      const totalVideosQuery = isAdmin
        ? { isActive: true }
        : requestingUser
        ? {
            isActive: true,
            $or: [
              { userId: requestingUser._id },
              {
                $and: [
                  { $or: [{ userId: null }, { userId: { $exists: false } }] },
                  { category: { $not: /^personal$/i } },
                ],
              },
            ],
          }
        : {
            isActive: true,
            $or: [{ userId: null }, { userId: { $exists: false } }],
            category: { $not: /^personal$/i },
          };

      const totalVideos = await Video.countDocuments(totalVideosQuery);

      return res.status(200).json({
        categories: categoriesWithCount,
        totalVideos,
      });
    }

    // For write operations, require admin authentication
    const { userId } = verifyToken(req);
    const requestingUser = await User.findById(userId);
    if (!requestingUser || requestingUser.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden. Admin access required.' });
    }

    // Explicit manual seed action (ONLY triggered if admin explicitly clicks "Seed Defaults")
    if (req.method === 'POST' && req.query.action === 'seed') {
      const existingCount = await VideoCategory.countDocuments();
      if (existingCount === 0) {
        await VideoCategory.insertMany(STARTER_CATEGORIES);
      }
      const allCats = await VideoCategory.find().sort({ order: 1, name: 1 });
      return res.status(200).json({
        message: 'Starter categories initialized successfully.',
        categories: allCats,
      });
    }

    // 2. POST: Create category
    if (req.method === 'POST') {
      const { name, description } = req.body || {};
      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Category name is required.' });
      }

      const trimmedName = name.trim();
      const escapedTrimmed = trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const existing = await VideoCategory.findOne({
        name: { $regex: new RegExp(`^${escapedTrimmed}$`, 'i') },
      });

      if (existing) {
        return res.status(400).json({ error: 'A category with this name already exists.' });
      }

      const newCategory = await VideoCategory.create({
        name: trimmedName,
        description: description ? description.trim() : '',
      });

      return res.status(201).json({
        category: { ...newCategory.toObject(), videoCount: 0 },
        message: 'Category created successfully.',
      });
    }

    // 3. PUT: Update category
    if (req.method === 'PUT') {
      const { id, name, description } = req.body || {};
      if (!id) {
        return res.status(400).json({ error: 'Category ID is required.' });
      }
      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Category name is required.' });
      }

      const category = await VideoCategory.findById(id);
      if (!category) {
        return res.status(404).json({ error: 'Category not found.' });
      }
      if (category.name.trim().toLowerCase() === 'personal' && name.trim().toLowerCase() !== 'personal') {
        return res.status(400).json({ error: 'The Personal group is a system group and cannot be renamed.' });
      }

      const trimmedName = name.trim();
      const escapedTrimmed = trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const existing = await VideoCategory.findOne({
        _id: { $ne: id },
        name: { $regex: new RegExp(`^${escapedTrimmed}$`, 'i') },
      });

      if (existing) {
        return res.status(400).json({ error: 'Another category with this name already exists.' });
      }

      const oldName = category.name;
      category.name = trimmedName;
      if (description !== undefined) {
        category.description = description.trim();
      }
      await category.save();

      // Sync name in existing videos if name changed
      if (oldName !== trimmedName) {
        const escapedOld = oldName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        await Video.updateMany(
          {
            $or: [
              { categoryId: category._id },
              { category: { $regex: new RegExp(`^${escapedOld}$`, 'i') } },
            ],
          },
          { category: trimmedName, categoryId: category._id }
        );
      }

      const count = await Video.countDocuments({
        $or: [
          { categoryId: category._id },
          { category: { $regex: new RegExp(`^${escapedTrimmed}$`, 'i') } },
        ],
        isActive: true,
      });

      return res.status(200).json({
        category: { ...category.toObject(), videoCount: count },
        message: 'Category updated successfully.',
      });
    }

    // 4. DELETE: Permanently remove category and cleanly unlink videos
    if (req.method === 'DELETE') {
      const id = req.query.id || req.body?.id;
      if (!id) {
        return res.status(400).json({ error: 'Category ID is required.' });
      }

      const category = await VideoCategory.findById(id);
      if (!category) {
        return res.status(404).json({ error: 'Category not found.' });
      }
      if (category.name.trim().toLowerCase() === 'personal') {
        return res.status(400).json({ error: 'The Personal group is a system group and cannot be deleted.' });
      }

      const oldCatName = category.name;
      await VideoCategory.deleteOne({ _id: id });

      // Unlink and update any videos that referenced this category to 'Uncategorized'
      const escapedOldName = oldCatName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      await Video.updateMany(
        {
          $or: [
            { categoryId: id },
            { category: { $regex: new RegExp(`^${escapedOldName}$`, 'i') } },
          ],
        },
        {
          categoryId: null,
          category: 'Uncategorized',
        }
      );

      return res.status(200).json({ message: 'Category deleted successfully.' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    if (err.message === 'No token' || err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    console.error('[training/categories]', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
