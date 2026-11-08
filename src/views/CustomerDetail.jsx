import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useUserStore } from '../store/useUserStore';
import { useApi } from '../hooks/useApi';
import { calcBMI, getBMICategory } from '../utils/bmiCalc';
import { getCurrentDayNumber } from '../utils/dateUtils';
import { getYouTubeId, getVideoEmbedUrl, getVideoThumbnail, isDirectVideoUrl } from '../utils/videoUtils';
import { broadcastTrainingUpdate } from '../utils/trainingSync';
import { format } from 'date-fns';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import { TASK_CONFIG, TASK_ORDER } from '../utils/taskConfig';
import { isTaskCompleted } from '../utils/taskCompletion';
import AdminSidebar from '../components/admin/AdminSidebar';

export default function CustomerDetail() {
  const { customerId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const api = useApi();
  const { logout, user: adminUser } = useUserStore();

  const [customer, setCustomer] = useState(null);
  const [customerTasks, setCustomerTasks] = useState([]);
  const [personalVideos, setPersonalVideos] = useState([]);
  const [videosLoading, setVideosLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [error, setError] = useState('');
  const [profileSubTab, setProfileSubTab] = useState(
    searchParams.get('tab') === 'videos' ? 'videos' : 'overview'
  ); // 'overview' | 'tasks' | 'videos'
  const [selectedTaskDay, setSelectedTaskDay] = useState(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Client-level Personal Video Upload / Edit / Preview states
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState(null);
  const [videoFormLoading, setVideoFormLoading] = useState(false);
  const [videoFormError, setVideoFormError] = useState('');
  const [previewVideo, setPreviewVideo] = useState(null);
  const [videoFormData, setVideoFormData] = useState({
    title: '',
    url: '',
    duration: '',
    description: '',
    thumbnailUrl: '',
  });

  // Edit / Delete states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [packages, setPackages] = useState([]);
  const [batches, setBatches] = useState([]);
  const [salesReps, setSalesReps] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
    packageId: '',
    batchId: '',
    salesRepId: '',
    age: '',
    heightCm: '',
    weightKg: '',
    gender: 'male',
    startDate: '',
  });

  useEffect(() => {
    fetchCustomerDetails();
    fetchPersonalVideos();
    fetchPackages();
    fetchBatches();
    fetchSalesReps();
  }, [customerId]);

  useEffect(() => {
    if (searchParams.get('tab') === 'videos') {
      setProfileSubTab('videos');
    }
  }, [searchParams]);

  const fetchPersonalVideos = async () => {
    setVideosLoading(true);
    try {
      const data = await api.get(`/api/training/videos?userId=${customerId}`);
      setPersonalVideos(data.videos || []);
    } catch (err) {
      console.error('Failed to fetch personal videos:', err);
    } finally {
      setVideosLoading(false);
    }
  };

  const openAddPersonalVideoModal = () => {
    setEditingVideo(null);
    setVideoFormData({
      title: '',
      url: '',
      duration: '',
      description: '',
      thumbnailUrl: '',
    });
    setVideoFormError('');
    setIsVideoModalOpen(true);
  };

  const openEditPersonalVideoModal = (video) => {
    setEditingVideo(video);
    setVideoFormData({
      title: video.title || '',
      url: video.url || '',
      duration: video.duration || '',
      description: video.description || '',
      thumbnailUrl: video.thumbnailUrl || '',
    });
    setVideoFormError('');
    setIsVideoModalOpen(true);
  };

  const handleSavePersonalVideo = async (e) => {
    e.preventDefault();
    if (!videoFormData.title.trim()) {
      setVideoFormError('Please enter a video title.');
      return;
    }
    if (!videoFormData.url.trim()) {
      setVideoFormError('Please enter a video URL link.');
      return;
    }

    setVideoFormLoading(true);
    setVideoFormError('');

    try {
      const payload = {
        ...videoFormData,
        category: 'Personal',
        userId: customerId,
      };

      if (editingVideo) {
        const res = await api.put('/api/training/videos', {
          id: editingVideo._id,
          ...payload,
        });
        setPersonalVideos((prev) =>
          prev.map((v) => (v._id === editingVideo._id ? res.video : v))
        );
        setSuccessMsg('Personalised video updated successfully!');
        broadcastTrainingUpdate({ type: 'video_updated', videoId: editingVideo._id });
      } else {
        const res = await api.post('/api/training/videos', payload);
        setPersonalVideos((prev) => [res.video, ...prev]);
        setSuccessMsg('Personalised video link uploaded for client!');
        broadcastTrainingUpdate({ type: 'video_created', videoId: res.video?._id });
      }
      setIsVideoModalOpen(false);
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      setVideoFormError(err.message || 'Failed to save personalised video');
    } finally {
      setVideoFormLoading(false);
    }
  };

  const handleDeletePersonalVideo = async (video) => {
    if (!window.confirm(`Remove personalised video "${video.title}" from ${customer?.name || 'this client'}?`)) {
      return;
    }
    try {
      await api.delete(`/api/training/videos?id=${video._id}`);
      setPersonalVideos((prev) => prev.filter((v) => v._id !== video._id));
      setSuccessMsg('Personalised video removed.');
      broadcastTrainingUpdate({ type: 'video_deleted', videoId: video._id });
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert(err.message || 'Failed to delete video');
    }
  };

  const fetchCustomerDetails = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Fetch customer details
      const custData = await api.get(`/api/admin/customers?id=${customerId}`);
      setCustomer(custData.customer);

      // 2. Fetch customer tasks
      setTasksLoading(true);
      const tasksData = await api.get(`/api/admin/customer-tasks?userId=${customerId}`);
      setCustomerTasks(tasksData.logs || []);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to fetch customer information');
    } finally {
      setLoading(false);
      setTasksLoading(false);
    }
  };

  const fetchPackages = async () => {
    try {
      const data = await api.get('/api/admin/packages');
      setPackages(data.packages || []);
    } catch (err) {
      console.error('Failed to fetch packages:', err);
    }
  };

  const fetchBatches = async () => {
    try {
      const data = await api.get('/api/admin/batches');
      setBatches(data.batches || []);
    } catch (err) {
      console.error('Failed to fetch batches:', err);
    }
  };

  const fetchSalesReps = async () => {
    try {
      const data = await api.get('/api/admin/sales-reps');
      setSalesReps(data.salesReps || []);
    } catch (err) {
      console.error('Failed to fetch sales reps:', err);
    }
  };


  const handleUpdateTaskLog = async (dayNumber, taskId, completed, amount) => {
    if (!customer) return;
    try {
      const res = await api.put('/api/admin/customer-tasks', {
        userId: customer._id,
        dayNumber,
        taskId,
        completed,
        amount
      });
      setCustomerTasks((prev) => {
        const exists = prev.some((l) => l.dayNumber === dayNumber && l.taskId === taskId);
        if (exists) {
          return prev.map((l) => (l.dayNumber === dayNumber && l.taskId === taskId) ? res.log : l);
        } else {
          return [...prev, res.log];
        }
      });
    } catch (err) {
      console.error('Failed to update task log:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const openEditModal = () => {
    if (!customer) return;
    setFormData({
      name: customer.name || '',
      phone: customer.phone || '',
      password: '',
      packageId: customer.packageId?._id || customer.packageId || '',
      batchId: customer.batchId?._id || customer.batchId || 'NONE',
      salesRepId: customer.salesRepId?._id || customer.salesRepId || '',
      age: customer.age || '',
      heightCm: customer.heightCm || '',
      weightKg: customer.weightKg || '',
      gender: customer.gender || 'male',
      startDate: customer.startDate ? new Date(customer.startDate).toISOString().split('T')[0] : '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);

    if (!formData.name.trim()) { setFormError('Name is required'); setFormLoading(false); return; }
    if (!formData.phone.trim()) { setFormError('Phone number is required'); setFormLoading(false); return; }
    if (!formData.packageId) { setFormError('Assigning the customer to a package is required'); setFormLoading(false); return; }

    const selectedPkg = packages.find((p) => p._id === formData.packageId);
    const isTesterPack = selectedPkg?.name === 'Tester Pack';
    if (!isTesterPack && (!formData.batchId || formData.batchId === 'NONE')) {
      setFormError('Regular packages must be assigned to a batch');
      setFormLoading(false);
      return;
    }

    try {
      const payload = {
        ...formData,
        id: customer._id,
        age: formData.age ? Number(formData.age) : undefined,
        heightCm: formData.heightCm ? Number(formData.heightCm) : undefined,
        weightKg: formData.weightKg ? Number(formData.weightKg) : undefined,
        batchId: isTesterPack || formData.batchId === 'NONE' ? null : formData.batchId,
        packageId: formData.packageId,
        salesRepId: formData.salesRepId || null,
      };
      if (!formData.password.trim()) {
        delete payload.password;
      }

      const res = await api.put('/api/admin/customers', payload);
      setCustomer(res.customer);
      setIsModalOpen(false);
      setSuccessMsg('Customer profile updated successfully!');
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      setFormError(err.message || 'Failed to save customer');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteCustomer = async () => {
    if (!customer) return;
    if (!window.confirm(`Are you sure you want to delete customer "${customer.name}"? This will permanently delete their account and all task logs.`)) {
      return;
    }
    try {
      await api.delete(`/api/admin/customers?id=${customer._id}`);
      navigate('/admin/customers', { replace: true });
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to delete customer');
    }
  };

  const getCurrentDayNumberLocal = (startDate, totalDays) => getCurrentDayNumber(startDate, totalDays);

  // Custom tooltips for graphs
  const CustomTooltip = ({ active, payload, label, unit }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2.5 rounded-xl border border-gray-200 shadow-md text-xs">
          <p className="font-bold text-gray-400 mb-0.5 uppercase tracking-wider">{label}</p>
          <p className="font-mono font-extrabold text-gray-900">
            {payload[0].value} {unit}
          </p>
        </div>
      );
    }
    return null;
  };

  // Stats Calculations
  const stats = getCustomerStats(customerTasks, customer);

  function getCustomerStats(logs, user) {
    if (!logs || !user) return {
      streak: 0,
      completedDaysCount: 0,
      totalDays: 30,
      totalWater: 0,
      totalYoga: 0,
      avgSleep: 0,
      totalProtein: 0,
      waterData: [],
      sleepData: [],
      proteinData: [],
      yogaData: []
    };

    const userBatch = batches.find((b) => b._id === (user.batchId?._id || user.batchId)) || user.batchId;
    const customerTotalDays = userBatch?.totalDays || user.totalDays || 30;
    const customerDayNum = getCurrentDayNumberLocal(user.startDate, customerTotalDays);
    const REQUIRED = ['yoga', 'meditation', 'water'];

    // Streak
    let streak = 0;
    for (let d = customerDayNum - 1; d >= 1; d--) {
      const dayLogs = logs.filter((l) => l.dayNumber === d);
      const allDone = REQUIRED.every((task) => {
        const log = dayLogs.find((l) => l.taskId === task);
        return isTaskCompleted(task, log, d, customerDayNum);
      });
      if (allDone) streak++;
      else break;
    }

    // Completed Days
    let completedDaysCount = 0;
    for (let d = 1; d <= customerTotalDays; d++) {
      const dayLogs = logs.filter((l) => l.dayNumber === d);
      const allDone = TASK_ORDER.every((taskId) => {
        const log = dayLogs.find((l) => l.taskId === taskId);
        return isTaskCompleted(taskId, log, d, customerDayNum);
      });
      if (allDone) completedDaysCount++;
    }

    // Totals
    const getCumStat = (taskId, avg = false) => {
      const items = logs.filter((l) => l.taskId === taskId && l.amount > 0);
      if (!items.length) return 0;
      const total = items.reduce((s, l) => s + l.amount, 0);
      return avg ? +(total / items.length).toFixed(1) : total;
    };

    const totalWater = getCumStat('water');
    const totalYoga = getCumStat('yoga');
    const totalMeditation = getCumStat('meditation');
    const avgSleep = getCumStat('sleep', true);
    const totalProtein = getCumStat('protein');

    // Charts
    const getChartData = (taskId) => {
      const maxChartDays = Math.max(customerDayNum, 5);
      return Array.from({ length: maxChartDays }, (_, i) => {
        const dNum = i + 1;
        const log = logs.find((l) => l.taskId === taskId && l.dayNumber === dNum);
        return {
          day: `D${dNum}`,
          val: log ? log.amount : 0
        };
      });
    };

    return {
      streak,
      completedDaysCount,
      totalDays: customerTotalDays,
      totalWater,
      totalYoga,
      totalMeditation,
      avgSleep,
      totalProtein,
      waterData: getChartData('water'),
      sleepData: getChartData('sleep'),
      proteinData: getChartData('protein'),
      yogaData: getChartData('yoga'),
      meditationData: getChartData('meditation')
    };
  }


  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] flex flex-col md:flex-row">
      {/* Universal Admin Sidebar */}
      <AdminSidebar
        activeTab="customers"
        isMobileSidebarOpen={isMobileSidebarOpen}
        setIsMobileSidebarOpen={setIsMobileSidebarOpen}
        activeBatchesCount={batches.filter(b => b.status === 'active' || (b.startDate && new Date(b.startDate) <= new Date())).length}
      />

      {/* Main Area */}
      <div className="flex-1 flex flex-col md:h-screen md:overflow-y-auto min-w-0">
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-2xl border-b border-black/[0.06] px-4 py-3 flex items-center justify-between md:px-8 shadow-2xs shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              aria-label="Open navigation menu"
              className="p-2 text-[#86868B] hover:text-[#1D1D1F] md:hidden hover:bg-black/[0.04] rounded-xl border border-black/[0.06] shrink-0"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <Link
              to="/admin/customers"
              className="p-1.5 sm:px-3 sm:py-1.5 text-[#1D1D1F] hover:bg-black/[0.04] rounded-full border border-black/[0.06] transition-colors flex items-center gap-1.5 text-xs font-semibold shadow-2xs shrink-0"
              title="Back to Customers Directory"
            >
              <svg className="w-4 h-4 shrink-0 text-[#86868B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="hidden sm:inline">Directory</span>
            </Link>
            <div className="flex items-center gap-1.5 min-w-0 font-display font-bold text-sm md:text-base text-[#1D1D1F] truncate">
              <span className="text-[#86868B] font-normal hidden sm:inline">/</span>
              <span className="truncate">{customer?.name || 'Customer Details'}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <span className="hidden sm:inline text-xs font-medium text-[#86868B]">
              Welcome, <span className="text-[#1D1D1F] font-semibold">{adminUser?.name || 'Administrator'}</span>
            </span>
            <div className="w-8 h-8 rounded-full bg-black/[0.05] text-[#1D1D1F] font-semibold text-xs flex items-center justify-center sm:hidden border border-black/[0.06]" title={adminUser?.name || 'Administrator'}>
              {(adminUser?.name || 'A').charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto overflow-y-auto">
          {loading ? (
            <div className="space-y-6">
              <div className="h-20 bg-white border border-black/[0.06] rounded-[24px] skeleton" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="h-32 bg-white border border-black/[0.06] rounded-[24px] skeleton" />
                <div className="md:col-span-2 h-32 bg-white border border-black/[0.06] rounded-[24px] skeleton" />
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-600 border border-red-200 rounded-[24px] p-6 text-center">
              <h3 className="font-display font-bold text-lg mb-2">Error Loading Details</h3>
              <p className="text-sm font-medium mb-4">{error}</p>
              <Link
                to="/admin/customers"
                className="btn-brand px-6 py-2.5 rounded-full text-xs font-semibold shadow-sm inline-flex items-center justify-center"
              >
                Back to Directory
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {successMsg && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl p-4 text-xs font-semibold">
                  {successMsg}
                </div>
              )}

              {/* Profile Card Header */}
              <div className="bg-white border border-black/[0.06] rounded-[24px] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-black/[0.04] text-[#1D1D1F] flex items-center justify-center font-display font-bold text-lg border border-black/[0.06]">
                    {customer.name?.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-xl text-[#1D1D1F] leading-tight">
                      {customer.name}
                    </h3>
                    <p className="text-xs text-[#86868B] mt-1 font-medium">
                      Phone: {customer.phone} · Start Date: {customer.startDate ? new Date(customer.startDate).toLocaleDateString() : '—'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={openAddPersonalVideoModal}
                    className="px-4 py-2 bg-[#1D1D1F] hover:bg-black text-white rounded-full text-xs font-semibold transition-all shadow-sm active:scale-95 flex items-center gap-1.5"
                  >
                    <span>✨ + Personal Video</span>
                  </button>
                  <button
                    onClick={openEditModal}
                    className="px-4 py-2 bg-[#00A86B] hover:bg-[#00915C] text-white rounded-full text-xs font-semibold transition-all shadow-sm active:scale-95"
                  >
                    Edit Profile
                  </button>
                  <button
                    onClick={handleDeleteCustomer}
                    className="px-4 py-2 bg-[#FF3B30]/[0.08] hover:bg-[#FF3B30]/[0.12] text-[#FF3B30] rounded-full text-xs font-semibold transition-all active:scale-95"
                  >
                    Delete Customer
                  </button>
                  <Link
                    to="/admin/customers"
                    className="px-4 py-2 bg-black/[0.04] hover:bg-black/[0.08] border border-black/[0.06] rounded-full text-xs font-semibold text-[#1D1D1F] transition-all inline-flex items-center justify-center active:scale-95"
                  >
                    Back to Directory
                  </Link>
                </div>
              </div>

              {/* Sub-tabs Selection (Apple Segmented Control Style) */}
              <div className="inline-flex flex-wrap p-1 bg-black/[0.05] rounded-xl select-none gap-1">
                <button
                  onClick={() => setProfileSubTab('overview')}
                  className={`px-4 py-1.5 rounded-[9px] text-xs font-semibold transition-all ${
                    profileSubTab === 'overview' ? 'bg-white text-[#1D1D1F] shadow-sm' : 'text-[#86868B] hover:text-[#1D1D1F]'
                  }`}
                >
                  Overview & Analytics
                </button>
                <button
                  onClick={() => setProfileSubTab('tasks')}
                  className={`px-4 py-1.5 rounded-[9px] text-xs font-semibold transition-all ${
                    profileSubTab === 'tasks' ? 'bg-white text-[#1D1D1F] shadow-sm' : 'text-[#86868B] hover:text-[#1D1D1F]'
                  }`}
                >
                  Daily Tasks Timeline
                </button>
                <button
                  onClick={() => setProfileSubTab('videos')}
                  className={`px-4 py-1.5 rounded-[9px] text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    profileSubTab === 'videos' ? 'bg-white text-[#00A86B] shadow-sm' : 'text-[#86868B] hover:text-[#1D1D1F]'
                  }`}
                >
                  <span>✨ Personal Tutorials</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#00A86B]/10 text-[#00A86B] font-bold">
                    {personalVideos.length}
                  </span>
                </button>
              </div>

              {/* SUBTAB 1: Overview & Analytics */}
              {profileSubTab === 'overview' && (
                <div className="space-y-6">
                  {tasksLoading ? (
                    <div className="space-y-4">
                      <div className="h-20 bg-gray-100 rounded-3xl skeleton" />
                      <div className="grid grid-cols-2 gap-4">
                        <div className="h-32 bg-gray-100 rounded-3xl skeleton" />
                        <div className="h-32 bg-gray-100 rounded-3xl skeleton" />
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Top stats Row */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Summary metrics card */}
                        <div className="md:col-span-1 border border-black/[0.06] rounded-[24px] p-5 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-center gap-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-[#86868B] font-semibold uppercase tracking-widest">Active Day</span>
                            <span className="bg-black/[0.04] border border-black/[0.06] text-[#1D1D1F] text-[10px] font-semibold px-2.5 py-0.5 rounded-full">
                              Day {getCurrentDayNumberLocal(customer.startDate, stats.totalDays)} / {stats.totalDays}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-3 mt-1">
                            <div className="w-9 h-9 rounded-xl bg-[#FF9500]/10 text-[#FF9500] flex items-center justify-center">
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              </svg>
                            </div>
                            <div>
                              <p className="font-display font-bold text-xl text-[#1D1D1F] leading-none">{stats.streak}</p>
                              <p className="text-[9px] text-[#86868B] font-semibold uppercase mt-1">Current Streak</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-[#34C759]/10 text-[#34C759] flex items-center justify-center">
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <div>
                              <p className="font-display font-bold text-xl text-[#1D1D1F] leading-none">{stats.completedDaysCount}</p>
                              <p className="text-[9px] text-[#86868B] font-semibold uppercase mt-1">Total Days Completed</p>
                            </div>
                          </div>
                        </div>

                        {/* Customer Health Profile Card */}
                        <div className="md:col-span-2 bg-white border border-black/[0.06] rounded-[24px] p-5 flex flex-col justify-between shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
                          <h4 className="font-display font-bold text-sm text-[#1D1D1F] border-b border-black/[0.06] pb-2.5 mb-3">Customer Health Profile</h4>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-medium text-[#1D1D1F]">
                            <div>
                              <p className="text-[#86868B] text-[10px] uppercase font-semibold">Age</p>
                              <p className="text-sm font-display font-bold text-[#1D1D1F] mt-1">{customer.age ? `${customer.age} yrs` : '—'}</p>
                            </div>
                            <div>
                              <p className="text-[#86868B] text-[10px] uppercase font-semibold">Gender</p>
                              <p className="text-sm font-display font-bold text-[#1D1D1F] mt-1 capitalize">{customer.gender || '—'}</p>
                            </div>
                            <div>
                              <p className="text-[#86868B] text-[10px] uppercase font-semibold">Height & Weight</p>
                              <p className="text-sm font-display font-bold text-[#1D1D1F] mt-1">{customer.heightCm ? `${customer.heightCm} cm` : '—'} / {customer.weightKg ? `${customer.weightKg} kg` : '—'}</p>
                            </div>
                            <div>
                              <p className="text-[#86868B] text-[10px] uppercase font-semibold">BMI Category</p>
                              {calcBMI(customer.heightCm, customer.weightKg) ? (
                                <p className="text-sm font-display font-bold text-[#1D1D1F] mt-1">
                                  {calcBMI(customer.heightCm, customer.weightKg).toFixed(1)} ({getBMICategory(calcBMI(customer.heightCm, customer.weightKg)).label})
                                </p>
                              ) : <p className="text-sm font-display font-bold text-[#1D1D1F] mt-1">—</p>}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="border border-black/[0.06] rounded-[20px] p-4 bg-white flex flex-col justify-between shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
                          <p className="text-[10px] text-[#86868B] font-semibold uppercase tracking-wider">Total Yoga &amp; Fitness</p>
                          <h3 className="font-display font-bold text-xl text-[#34C759] mt-1.5">{stats.totalYoga ? `${stats.totalYoga} min` : '0 min'}</h3>
                        </div>
                        <div className="border border-black/[0.06] rounded-[20px] p-4 bg-white flex flex-col justify-between shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
                          <p className="text-[10px] text-[#86868B] font-semibold uppercase tracking-wider">Total Meditation</p>
                          <h3 className="font-display font-bold text-xl text-[#AF52DE] mt-1.5">{stats.totalMeditation ? `${stats.totalMeditation} min` : '0 min'}</h3>
                        </div>
                        <div className="border border-black/[0.06] rounded-[20px] p-4 bg-white flex flex-col justify-between shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
                          <p className="text-[10px] text-[#86868B] font-semibold uppercase tracking-wider">Total Water Hydrated</p>
                          <h3 className="font-display font-bold text-xl text-[#0071E3] mt-1.5">{stats.totalWater ? `${(stats.totalWater/1000).toFixed(1)} L` : '0 L'}</h3>
                        </div>
                        <div className="border border-black/[0.06] rounded-[20px] p-4 bg-white flex flex-col justify-between shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
                          <p className="text-[10px] text-[#86868B] font-semibold uppercase tracking-wider">Average Sleep</p>
                          <h3 className="font-display font-bold text-xl text-[#5856D6] mt-1.5">{stats.avgSleep ? `${stats.avgSleep} hrs` : '0 hrs'}</h3>
                        </div>
                      </div>

                      {/* Progress charts */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Yoga Sessions chart */}
                        <div className="bg-white border border-black/[0.06] rounded-[24px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
                          <h4 className="font-display font-bold text-xs text-[#1D1D1F] uppercase tracking-widest mb-4">Yoga & Fitness minutes</h4>
                          <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={stats.yogaData}>
                                <defs>
                                  <linearGradient id="yogaGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#34C759" stopOpacity={0.25} />
                                    <stop offset="95%" stopColor="#34C759" stopOpacity={0.0} />
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F2" />
                                <XAxis dataKey="day" stroke="#86868B" fontSize={10} tickLine={false} />
                                <YAxis stroke="#86868B" fontSize={10} tickLine={false} />
                                <Tooltip content={<CustomTooltip unit="min" />} />
                                <Area type="monotone" dataKey="val" stroke="#34C759" strokeWidth={2} fillOpacity={1} fill="url(#yogaGrad)" />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* Meditation Sessions chart */}
                        <div className="bg-white border border-black/[0.06] rounded-[24px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
                          <h4 className="font-display font-bold text-xs text-[#1D1D1F] uppercase tracking-widest mb-4">Meditation minutes</h4>
                          <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={stats.meditationData}>
                                <defs>
                                  <linearGradient id="meditationGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#AF52DE" stopOpacity={0.25} />
                                    <stop offset="95%" stopColor="#AF52DE" stopOpacity={0.0} />
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F2" />
                                <XAxis dataKey="day" stroke="#86868B" fontSize={10} tickLine={false} />
                                <YAxis stroke="#86868B" fontSize={10} tickLine={false} />
                                <Tooltip content={<CustomTooltip unit="min" />} />
                                <Area type="monotone" dataKey="val" stroke="#AF52DE" strokeWidth={2} fillOpacity={1} fill="url(#meditationGrad)" />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* Water Hydration chart */}
                        <div className="bg-white border border-black/[0.06] rounded-[24px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
                          <h4 className="font-display font-bold text-xs text-[#1D1D1F] uppercase tracking-widest mb-4">Water Hydration (ml)</h4>
                          <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={stats.waterData}>
                                <defs>
                                  <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#0071E3" stopOpacity={0.25} />
                                    <stop offset="95%" stopColor="#0071E3" stopOpacity={0.0} />
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F2" />
                                <XAxis dataKey="day" stroke="#86868B" fontSize={10} tickLine={false} />
                                <YAxis stroke="#86868B" fontSize={10} tickLine={false} />
                                <Tooltip content={<CustomTooltip unit="ml" />} />
                                <Area type="monotone" dataKey="val" stroke="#0071E3" strokeWidth={2} fillOpacity={1} fill="url(#waterGrad)" />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* Sleep logs chart */}
                        <div className="bg-white border border-black/[0.06] rounded-[24px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
                          <h4 className="font-display font-bold text-xs text-[#1D1D1F] uppercase tracking-widest mb-4">Sleep duration (hrs)</h4>
                          <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={stats.sleepData}>
                                <defs>
                                  <linearGradient id="sleepGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#5856D6" stopOpacity={0.25} />
                                    <stop offset="95%" stopColor="#5856D6" stopOpacity={0.0} />
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F2" />
                                <XAxis dataKey="day" stroke="#86868B" fontSize={10} tickLine={false} />
                                <YAxis stroke="#86868B" fontSize={10} tickLine={false} />
                                <Tooltip content={<CustomTooltip unit="hrs" />} />
                                <Area type="monotone" dataKey="val" stroke="#5856D6" strokeWidth={2} fillOpacity={1} fill="url(#sleepGrad)" />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                      </div>
                    </>
                  )}
                </div>
              )}

              {/* SUBTAB 2: Daily Tasks Timeline */}
              {profileSubTab === 'tasks' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  
                  {/* Left Column: Challenge Grid */}
                  <div className="lg:col-span-8 bg-white border border-border rounded-[2rem] p-6 shadow-sm">
                    <div className="flex items-center justify-between border-b border-border pb-3 mb-5">
                      <h4 className="font-display font-extrabold text-sm text-gray-900">{stats.totalDays}-Day Challenge Timeline</h4>
                      <p className="text-[10px] text-muted font-bold uppercase">Click any day to view/edit logs</p>
                    </div>

                    <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-10 gap-3.5">
                      {Array.from({ length: stats.totalDays }, (_, i) => {
                        const dayNum = i + 1;
                        const customerDayNum = getCurrentDayNumberLocal(customer.startDate, stats.totalDays);
                        const isUnlocked = dayNum <= customerDayNum;
                        
                        const dayLogs = customerTasks.filter((l) => l.dayNumber === dayNum);
                        const completedCount = TASK_ORDER.filter((taskId) => {
                          const log = dayLogs.find((l) => l.taskId === taskId);
                          return isTaskCompleted(taskId, log, dayNum, customerDayNum);
                        }).length;

                        let bgStyle = 'bg-white text-gray-900 border-border hover:border-brand-300';
                        if (!isUnlocked) bgStyle = 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed';
                        else if (completedCount === TASK_ORDER.length) bgStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/50';
                        else if (completedCount > 0) bgStyle = 'bg-brand-50/40 text-brand-700 border-brand-100 hover:bg-brand-50/80';

                        const isSelected = selectedTaskDay === dayNum;

                        return (
                          <button
                            key={dayNum}
                            disabled={!isUnlocked}
                            onClick={() => setSelectedTaskDay(dayNum)}
                            className={`h-14 rounded-2xl border flex flex-col items-center justify-center font-display font-extrabold transition-all relative ${bgStyle} ${
                              isSelected ? 'ring-2 ring-brand-500 ring-offset-2 scale-[1.03] z-10' : ''
                            }`}
                          >
                            <span className="text-xs leading-none">D{dayNum}</span>
                            {isUnlocked && (
                              <span className="text-[8px] mt-1 opacity-75 font-mono">{completedCount}/{TASK_ORDER.length}</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right Column: Day details tracker log editor */}
                  <div className="lg:col-span-4 bg-white border border-border rounded-[2rem] p-6 shadow-sm min-h-[300px] sticky top-6">
                    {selectedTaskDay ? (() => {
                      const customerDayNum = getCurrentDayNumberLocal(customer.startDate);
                      const dayLogs = customerTasks.filter((l) => l.dayNumber === selectedTaskDay);

                      return (
                        <div className="space-y-5">
                          <div className="border-b border-border pb-3 flex justify-between items-center">
                            <h4 className="font-display font-extrabold text-sm text-gray-900">Logs for Day {selectedTaskDay}</h4>
                            <span className="text-[10px] bg-brand-50 text-brand-700 font-bold px-2 py-0.5 rounded-lg border border-brand-100">
                              {selectedTaskDay === customerDayNum ? 'Today' : selectedTaskDay < customerDayNum ? 'Past Day' : 'Future'}
                            </span>
                          </div>

                          <div className="space-y-4">
                            {TASK_ORDER.map((taskId) => {
                              const config = TASK_CONFIG[taskId];
                              const log = dayLogs.find((l) => l.taskId === taskId);
                              const isCompleted = isTaskCompleted(taskId, log, selectedTaskDay, customerDayNum);

                              return (
                                <div key={taskId} className="p-3.5 bg-gray-50/50 border border-border/80 rounded-2xl flex flex-col gap-2">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <span className="text-lg">{config.icon}</span>
                                      <span className="font-display font-bold text-xs text-gray-800">{config.title}</span>
                                    </div>
                                    <input
                                      type="checkbox"
                                      checked={isCompleted}
                                      onChange={(e) => handleUpdateTaskLog(selectedTaskDay, taskId, e.target.checked, log?.amount || 0)}
                                      className="rounded-lg border-gray-300 text-brand-500 focus:ring-brand-400 focus:border-brand-500 w-4 h-4 cursor-pointer"
                                    />
                                  </div>

                                  {config.hasAmount && (
                                    <div className="flex items-center justify-between gap-3 mt-1 pt-2 border-t border-dashed border-gray-200">
                                      <span className="text-[10px] text-muted font-semibold uppercase">{config.amountLabel} ({config.unit})</span>
                                      <div className="flex items-center gap-1.5">
                                        <input
                                          type="number"
                                          value={log?.amount || 0}
                                          onChange={(e) => {
                                            const amt = Math.max(0, Number(e.target.value));
                                            handleUpdateTaskLog(selectedTaskDay, taskId, amt > 0, amt);
                                          }}
                                          className="w-16 bg-white border border-border rounded-lg text-right text-xs px-2 py-1 focus:outline-none font-bold font-mono text-gray-800"
                                        />
                                        <span className="text-[10px] text-gray-500 font-bold">{config.unit}</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })() : (
                      <div className="h-48 flex flex-col items-center justify-center text-center p-4">
                        <div className="text-gray-300 text-3xl mb-2">📅</div>
                        <p className="text-sm font-bold text-gray-800">No day selected</p>
                        <p className="text-xs text-gray-400 mt-1 max-w-xs">Click on any day in the timeline grid on the left to edit daily logs.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SUBTAB 3: Personal Tutorials (Client-Level Video Link Upload & Management) */}
              {profileSubTab === 'videos' && (
                <div className="space-y-6">
                  <div className="bg-white border border-black/[0.06] rounded-[24px] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#00A86B]/10 text-[#00A86B] text-[10px] font-bold uppercase tracking-wider mb-1.5 border border-[#00A86B]/20">
                        <span>✨ Personal Group</span>
                      </div>
                      <h4 className="font-display font-bold text-base sm:text-lg text-[#1D1D1F]">
                        Personalised Tutorials for {customer.name}
                      </h4>
                      <p className="text-xs text-[#86868B] mt-0.5">
                        Upload video links tailored specifically for this client. They will appear under the &ldquo;Personal&rdquo; group on {customer.name}&apos;s Tutorials screen.
                      </p>
                    </div>
                    <button
                      onClick={openAddPersonalVideoModal}
                      className="px-5 py-2.5 bg-[#00A86B] hover:bg-[#00915C] text-white rounded-full text-xs font-bold shadow-sm transition-all active:scale-95 shrink-0 flex items-center gap-2 self-start sm:self-center"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                      <span>Upload Personal Video Link</span>
                    </button>
                  </div>

                  {videosLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {[1, 2, 3].map((n) => (
                        <div key={n} className="h-56 bg-white rounded-[24px] border border-black/[0.06] skeleton" />
                      ))}
                    </div>
                  ) : personalVideos.length === 0 ? (
                    <div className="bg-white border border-black/[0.06] rounded-[24px] p-10 text-center max-w-md mx-auto space-y-3 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
                      <div className="w-12 h-12 rounded-2xl bg-[#00A86B]/10 text-[#00A86B] flex items-center justify-center mx-auto text-xl">
                        🎥
                      </div>
                      <h5 className="font-display font-bold text-sm text-[#1D1D1F]">
                        No Personal Videos Uploaded Yet
                      </h5>
                      <p className="text-xs text-[#86868B] leading-relaxed">
                        Add a YouTube, Vimeo, or direct video link for {customer.name}. It will be placed in their Personal group on the Tutorials tab.
                      </p>
                      <button
                        onClick={openAddPersonalVideoModal}
                        className="mt-2 px-4 py-2 bg-[#00A86B] hover:bg-[#00915C] text-white rounded-full text-xs font-bold transition-all"
                      >
                        + Upload First Personal Video
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {personalVideos.map((vid) => {
                        const thumb = getVideoThumbnail(vid.url, vid.thumbnailUrl);
                        return (
                          <div
                            key={vid._id}
                            className="bg-white rounded-[24px] border border-black/[0.06] overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between group"
                          >
                            <div>
                              <div
                                onClick={() => setPreviewVideo(vid)}
                                className="relative aspect-video w-full bg-gray-900 overflow-hidden cursor-pointer"
                              >
                                {thumb ? (
                                  <img
                                    src={thumb}
                                    alt={vid.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-gray-800 text-white text-xs">
                                    Play Video
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                                  <div className="w-11 h-11 rounded-full bg-[#00A86B] text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                                    <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M8 5v14l11-7z" />
                                    </svg>
                                  </div>
                                </div>
                                <div className="absolute top-3 left-3">
                                  <span className="px-2.5 py-1 rounded-xl bg-[#00A86B] text-white text-[10px] font-bold shadow-sm">
                                    ✨ Personal
                                  </span>
                                </div>
                                {vid.duration && (
                                  <div className="absolute bottom-3 right-3">
                                    <span className="px-2 py-0.5 rounded-lg bg-black/75 text-white text-[10px] font-bold">
                                      {vid.duration}
                                    </span>
                                  </div>
                                )}
                              </div>

                              <div className="p-4 space-y-1.5">
                                <h5 className="font-display font-bold text-sm text-[#1D1D1F] line-clamp-2">
                                  {vid.title}
                                </h5>
                                {vid.description && (
                                  <p className="text-xs text-[#86868B] line-clamp-2">
                                    {vid.description}
                                  </p>
                                )}
                                <a
                                  href={vid.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-block text-[11px] text-[#00A86B] hover:underline truncate max-w-full font-medium pt-1"
                                >
                                  {vid.url}
                                </a>
                              </div>
                            </div>

                            <div className="px-4 py-3 border-t border-black/[0.05] flex items-center justify-between bg-black/[0.01]">
                              <button
                                onClick={() => setPreviewVideo(vid)}
                                className="text-xs font-bold text-[#00A86B] hover:underline"
                              >
                                Preview
                              </button>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => openEditPersonalVideoModal(vid)}
                                  className="px-2.5 py-1 rounded-lg bg-black/[0.04] hover:bg-black/[0.08] text-xs font-semibold text-[#1D1D1F] transition-colors"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeletePersonalVideo(vid)}
                                  className="px-2.5 py-1 rounded-lg bg-[#FF3B30]/10 hover:bg-[#FF3B30]/20 text-xs font-semibold text-[#FF3B30] transition-colors"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Client-Level Personal Video Upload / Edit Modal */}
      {isVideoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-[28px] border border-black/[0.08] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-black/[0.06] flex items-center justify-between bg-[#F5F5F7]/70">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#00A86B]">
                  ✨ Personal Tutorial · {customer?.name}
                </span>
                <h3 className="font-display font-bold text-base text-[#1D1D1F]">
                  {editingVideo ? 'Edit Personalised Video Link' : 'Upload Personalised Video Link'}
                </h3>
              </div>
              <button
                type="button"
                disabled={videoFormLoading}
                onClick={() => setIsVideoModalOpen(false)}
                className="w-8 h-8 rounded-full bg-black/[0.05] hover:bg-black/[0.08] flex items-center justify-center text-[#86868B]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePersonalVideo} className="p-6 space-y-4 overflow-y-auto">
              {videoFormError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-bold text-red-700">
                  {videoFormError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Video Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Custom Knee & Back Mobility Routine"
                  value={videoFormData.title}
                  onChange={(e) => setVideoFormData({ ...videoFormData, title: e.target.value })}
                  className="w-full rounded-2xl border border-border bg-[#FAFAFA] px-4 py-3 text-sm focus:outline-none text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Video URL Link *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://www.youtube.com/watch?v=... or direct video link"
                  value={videoFormData.url}
                  onChange={(e) => setVideoFormData({ ...videoFormData, url: e.target.value })}
                  className="w-full rounded-2xl border border-border bg-[#FAFAFA] px-4 py-3 text-sm focus:outline-none text-gray-900"
                />
                {getYouTubeId(videoFormData.url) && (
                  <div className="mt-2 p-2 bg-emerald-50/60 rounded-xl border border-emerald-200 flex items-center gap-3">
                    <img
                      src={`https://img.youtube.com/vi/${getYouTubeId(videoFormData.url)}/hqdefault.jpg`}
                      alt="YouTube thumbnail"
                      className="w-16 h-10 object-cover rounded-lg"
                    />
                    <span className="text-[11px] font-bold text-emerald-800">
                      ✓ YouTube thumbnail detected automatically
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Duration (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 15 min"
                  value={videoFormData.duration}
                  onChange={(e) => setVideoFormData({ ...videoFormData, duration: e.target.value })}
                  className="w-full rounded-2xl border border-border bg-[#FAFAFA] px-4 py-3 text-sm focus:outline-none text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Personalised Notes / Description (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Instructions or notes specifically for this client..."
                  value={videoFormData.description}
                  onChange={(e) => setVideoFormData({ ...videoFormData, description: e.target.value })}
                  className="w-full rounded-2xl border border-border bg-[#FAFAFA] px-4 py-2.5 text-sm focus:outline-none text-gray-900"
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-black/[0.06]">
                <button
                  type="button"
                  disabled={videoFormLoading}
                  onClick={() => setIsVideoModalOpen(false)}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 rounded-2xl font-bold text-xs text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={videoFormLoading}
                  className="flex-1 py-3 bg-[#00A86B] hover:bg-[#00915C] rounded-2xl font-bold text-xs text-white shadow-sm"
                >
                  {videoFormLoading
                    ? 'Saving...'
                    : editingVideo
                    ? 'Save Changes'
                    : 'Upload to Personal Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Video Preview Modal */}
      {previewVideo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
          onClick={() => setPreviewVideo(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-gray-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 flex items-center justify-between border-b border-gray-200 bg-gray-50">
              <div className="min-w-0 pr-2">
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md">
                  ✨ Personal · {customer?.name}
                </span>
                <h3 className="font-display font-extrabold text-sm md:text-base text-gray-900 truncate mt-1">
                  {previewVideo.title}
                </h3>
              </div>
              <button
                onClick={() => setPreviewVideo(null)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full"
              >
                ✕
              </button>
            </div>
            <div className="relative aspect-video w-full bg-black">
              {isDirectVideoUrl(previewVideo.url) ? (
                <video src={previewVideo.url} controls autoPlay className="w-full h-full" />
              ) : (
                <iframe
                  src={getVideoEmbedUrl(previewVideo.url)}
                  title={previewVideo.title}
                  className="w-full h-full"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Customer Profile Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => !formLoading && setIsModalOpen(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
          />

          <div className="bg-white w-full max-w-lg rounded-[2.5rem] border border-border shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-5 border-b border-border bg-gradient-to-r from-brand-50/50 to-transparent flex items-center justify-between shrink-0">
              <h3 className="font-display font-extrabold text-lg text-gray-900">
                Edit Customer Profile
              </h3>
              <button
                disabled={formLoading}
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200/80 flex items-center justify-center text-gray-500 transition-colors"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {formError && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-3 text-xs text-red-700 font-bold">
                  {formError}
                </div>
              )}

              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Name *</label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full rounded-2xl border border-border bg-[#FAFAFA] px-4 py-3 text-sm focus:outline-none text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Phone *</label>
                    <input
                      type="tel"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full rounded-2xl border border-border bg-[#FAFAFA] px-4 py-3 text-sm focus:outline-none text-gray-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Password (leave blank to keep unchanged)</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full rounded-2xl border border-border bg-[#FAFAFA] px-4 py-3 text-sm focus:outline-none text-gray-900"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Package *</label>
                    <select
                      name="packageId"
                      required
                      value={formData.packageId}
                      onChange={handleInputChange}
                      className="w-full rounded-2xl border border-border bg-[#FAFAFA] px-3 py-3 text-sm focus:outline-none text-gray-900"
                    >
                      <option value="" disabled>Select a Package</option>
                      {packages.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Class / Batch *</label>
                    <select
                      name="batchId"
                      required
                      value={formData.batchId}
                      onChange={handleInputChange}
                      disabled={packages.find(p => p._id === formData.packageId)?.name === 'Tester Pack'}
                      className="w-full rounded-2xl border border-border bg-[#FAFAFA] px-3 py-3 text-sm focus:outline-none text-gray-900 disabled:opacity-75 disabled:bg-gray-100"
                    >
                      <option value="" disabled>Select a Batch/Class</option>
                      <option value="NONE">NONE (Tester Pack / Starts manually)</option>
                      {batches.map((b) => {
                        const isStarted = new Date(b.startDate) <= new Date();
                        const currentBatchId = customer?.batchId?._id || customer?.batchId || '';
                        const isCurrentBatch = currentBatchId && (currentBatchId === b._id);
                        const isOptionDisabled = isStarted && !isCurrentBatch;
                        return (
                          <option key={b._id} value={b._id} disabled={isOptionDisabled}>
                            {b.name} (Starts {new Date(b.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}){isStarted ? ' - Started' : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Assigned Telecaller (Sales Rep)</label>
                  <select
                    name="salesRepId"
                    value={formData.salesRepId}
                    onChange={handleInputChange}
                    className="w-full rounded-2xl border border-border bg-[#FAFAFA] px-3 py-3 text-sm focus:outline-none text-gray-900"
                  >
                    <option value="">None (Unassigned)</option>
                    {salesReps.map((rep) => (
                      <option key={rep._id} value={rep._id}>
                        {rep.name}
                      </option>
                    ))}
                  </select>
                </div>



                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Age</label>
                    <input
                      type="number"
                      name="age"
                      value={formData.age}
                      onChange={handleInputChange}
                      className="w-full rounded-2xl border border-border bg-[#FAFAFA] px-3 py-3 text-sm focus:outline-none text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Height (cm)</label>
                    <input
                      type="number"
                      name="heightCm"
                      value={formData.heightCm}
                      onChange={handleInputChange}
                      className="w-full rounded-2xl border border-border bg-[#FAFAFA] px-3 py-3 text-sm focus:outline-none text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Weight (kg)</label>
                    <input
                      type="number"
                      name="weightKg"
                      value={formData.weightKg}
                      onChange={handleInputChange}
                      className="w-full rounded-2xl border border-border bg-[#FAFAFA] px-3 py-3 text-sm focus:outline-none text-gray-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Gender</label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="w-full rounded-2xl border border-border bg-[#FAFAFA] px-3 py-3 text-sm focus:outline-none text-gray-900"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleInputChange}
                      className="w-full rounded-2xl border border-border bg-[#FAFAFA] px-3 py-3 text-sm focus:outline-none text-gray-900"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 bg-gray-100 rounded-2xl font-bold text-sm text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 py-3 btn-brand rounded-2xl font-bold text-sm text-white shadow-brand"
                >
                  {formLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
