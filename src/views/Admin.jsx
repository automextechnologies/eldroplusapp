import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useUserStore } from '../store/useUserStore';
import { useApi } from '../hooks/useApi';
import { calcBMI, getBMICategory } from '../utils/bmiCalc';
import { getCurrentDayNumber, calculateEndDate, calculateTotalDays, formatDateStr, parseLocalDate } from '../utils/dateUtils';
import { format } from 'date-fns';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import { TASK_CONFIG, TASK_ORDER } from '../utils/taskConfig';
import { isTaskCompleted } from '../utils/taskCompletion';
import RecordedVideosManager from '../components/admin/RecordedVideosManager';
import MeetingsManager from '../components/admin/MeetingsManager';
import AdminSidebar from '../components/admin/AdminSidebar';

export default function Admin() {
  const { tab: urlTab } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const api = useApi();
  const { logout, user: adminUser } = useUserStore();

  const [customers, setCustomers] = useState([]);
  const [batches, setBatches] = useState([]);
  const [packages, setPackages] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [salesReps, setSalesReps] = useState([]);

  // Sales Rep Form State
  const [isSalesRepModalOpen, setIsSalesRepModalOpen] = useState(false);
  const [editingSalesRep, setEditingSalesRep] = useState(null);
  const [salesRepFormData, setSalesRepFormData] = useState({ name: '' });
  const [salesRepFormLoading, setSalesRepFormLoading] = useState(false);
  const [salesRepFormError, setSalesRepFormError] = useState('');

  // Map route aliases to active tab identifier
  const normalizeTab = (t) => {
    if (t === 'contacts' || t === 'customer') return 'customers';
    if (t === 'sales-reps') return 'salesreps';
    if (t === 'recorded-video' || t === 'recorded-videos' || t === 'videos') return 'recorded-video';
    if (t === 'meetings' || t === 'meeting') return 'meetings';
    if (t === 'push-notifications' || t === 'notifications') return 'dashboard';
    return t || 'dashboard';
  };

  const activeTab = normalizeTab(urlTab || location.state?.activeTab);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [selectedBatchFilter, setSelectedBatchFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Customer Form State
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Customer selection & delete modal state
  const [selectedCustomerIds, setSelectedCustomerIds] = useState([]);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, targetCustomer: null, isBulk: false });
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
    age: '',
    gender: '',
    heightCm: '',
    weightKg: '',
    startDate: '',
    batchId: '',
    packageId: '',
    salesRepId: '',
  });

  // Batch Form State
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);
  const [viewingBatchMembers, setViewingBatchMembers] = useState(null);
  const [deleteBatchModal, setDeleteBatchModal] = useState({ isOpen: false, batch: null, loading: false });
  const [batchFormData, setBatchFormData] = useState({
    name: '',
    startDate: formatDateStr(new Date()),
    durationMonths: 1,
    endDate: formatDateStr(calculateEndDate(formatDateStr(new Date()), 1)),
  });
  const [batchFormLoading, setBatchFormLoading] = useState(false);
  const [batchFormError, setBatchFormError] = useState('');

  // Package Form State
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [packageFormData, setPackageFormData] = useState({
    name: '',
    description: '',
    items: '',
    price: '',
  });
  const [packageFormLoading, setPackageFormLoading] = useState(false);
  const [packageFormError, setPackageFormError] = useState('');

  // Customer Tasks / Progress Overview States
  const [taskViewerCustomer, setTaskViewerCustomer] = useState(null);
  const [customerTasks, setCustomerTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [selectedTaskDay, setSelectedTaskDay] = useState(null);
  const [profileSubTab, setProfileSubTab] = useState('overview'); // 'overview' | 'tasks'

  // Tickets Form State
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState(null);
  const [ticketFormData, setTicketFormData] = useState({
    name: '',
    phone: '',
    email: '',
    enquiry: '',
    requestedConsultations: '',
    dueDate: '',
    status: 'new ticket',
  });
  const [ticketFormLoading, setTicketFormLoading] = useState(false);
  const [ticketFormError, setTicketFormError] = useState('');

  useEffect(() => {
    fetchCustomers();
    fetchBatches();
    fetchTickets();
    fetchPackages();
    fetchSalesReps();
  }, []);

  async function fetchCustomers() {
    setLoading(true);
    setError('');
    try {
      const data = await api.get('/api/admin/customers');
      setCustomers(data.customers || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  }

  async function fetchBatches() {
    try {
      const data = await api.get('/api/admin/batches');
      setBatches(data.batches || []);
    } catch (err) {
      console.error('Failed to fetch batches:', err);
    }
  }

  async function fetchTickets() {
    try {
      const data = await api.get('/api/admin/tickets');
      setTickets(data.tickets || []);
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
    }
  }

  async function fetchPackages() {
    try {
      const data = await api.get('/api/admin/packages');
      setPackages(data.packages || []);
    } catch (err) {
      console.error('Failed to fetch packages:', err);
    }
  }

  async function fetchSalesReps() {
    try {
      const data = await api.get('/api/admin/sales-reps');
      setSalesReps(data.salesReps || []);
    } catch (err) {
      console.error('Failed to fetch sales reps:', err);
    }
  }

  async function handleLogout() {
    logout();
    navigate('/login');
  }

  // Customer Form handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      if (name === 'packageId' && value) {
        const selectedPkg = packages.find((p) => p._id === value);
        if (selectedPkg && selectedPkg.name === 'Tester Pack') {
          next.batchId = 'NONE';
          next.startDate = '';
        }
      }
      if (name === 'batchId' && value) {
        if (value === 'NONE') {
          next.startDate = '';
        } else {
          const selectedBatch = batches.find((b) => b._id === value);
          if (selectedBatch) {
            next.startDate = new Date(selectedBatch.startDate).toISOString().split('T')[0];
          }
        }
      }
      return next;
    });
  };

  const openCreateModal = () => {
    setEditingCustomer(null);
    setFormData({
      name: '',
      phone: '',
      password: '',
      age: '',
      gender: '',
      heightCm: '',
      weightKg: '',
      startDate: '',
      batchId: '',
      packageId: '',
      salesRepId: '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name || '',
      phone: customer.phone || '',
      password: '',
      age: customer.age !== undefined ? String(customer.age) : '',
      gender: customer.gender || '',
      heightCm: customer.heightCm !== undefined ? String(customer.heightCm) : '',
      weightKg: customer.weightKg !== undefined ? String(customer.weightKg) : '',
      startDate: customer.startDate ? new Date(customer.startDate).toISOString().split('T')[0] : '',
      batchId: customer.batchId?._id || customer.batchId || (customer.packageId?.name === 'Tester Pack' ? 'NONE' : ''),
      packageId: customer.packageId?._id || customer.packageId || '',
      salesRepId: customer.salesRepId?._id || customer.salesRepId || '',
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
    if (!editingCustomer && !formData.password.trim()) { setFormError('Password is required'); setFormLoading(false); return; }
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
        age: formData.age ? Number(formData.age) : undefined,
        heightCm: formData.heightCm ? Number(formData.heightCm) : undefined,
        weightKg: formData.weightKg ? Number(formData.weightKg) : undefined,
        batchId: isTesterPack || formData.batchId === 'NONE' ? null : formData.batchId,
        packageId: formData.packageId,
        salesRepId: formData.salesRepId || null,
      };

      if (editingCustomer) {
        payload.id = editingCustomer._id;
        if (!formData.password.trim()) {
          delete payload.password;
        }
        const res = await api.put('/api/admin/customers', payload);
        setCustomers((prev) => prev.map((c) => c._id === res.customer._id ? res.customer : c));
        setSuccessMsg(`Customer "${res.customer.name}" updated successfully!`);
      } else {
        const res = await api.post('/api/admin/customers', payload);
        setCustomers((prev) => [res.customer, ...prev]);
        setSuccessMsg(`Customer "${res.customer.name}" created successfully!`);
        setFormData({
          name: '',
          phone: '',
          password: '',
          age: '',
          gender: '',
          heightCm: '',
          weightKg: '',
          startDate: '',
          batchId: '',
          packageId: '',
          salesRepId: '',
        });
      }

      setIsModalOpen(false);
      setFormError('');
      setTimeout(() => setSuccessMsg(''), 5000);
      fetchBatches();
    } catch (err) {
      setFormError(err.message || 'Failed to save customer');
    } finally {
      setFormLoading(false);
    }
  };

  const openDeleteModal = (customer, isBulk = false) => {
    setDeleteModal({
      isOpen: true,
      targetCustomer: customer,
      isBulk,
    });
  };

  const handleConfirmDelete = async () => {
    setDeleteLoading(true);
    try {
      if (deleteModal.isBulk) {
        const count = selectedCustomerIds.length;
        if (count === 0) return;
        await api.delete(`/api/admin/customers?ids=${selectedCustomerIds.join(',')}`, { ids: selectedCustomerIds });
        setCustomers((prev) => prev.filter((c) => !selectedCustomerIds.includes(c._id)));
        setSelectedCustomerIds([]);
        setSuccessMsg(`Successfully deleted ${count} customer(s).`);
      } else if (deleteModal.targetCustomer) {
        const cust = deleteModal.targetCustomer;
        await api.delete(`/api/admin/customers?id=${cust._id}`, { id: cust._id });
        setCustomers((prev) => prev.filter((c) => c._id !== cust._id));
        setSelectedCustomerIds((prev) => prev.filter((id) => id !== cust._id));
        setSuccessMsg(`Customer "${cust.name}" deleted successfully.`);
      }
      setTimeout(() => setSuccessMsg(''), 5000);
      fetchBatches();
      setDeleteModal({ isOpen: false, targetCustomer: null, isBulk: false });
      navigate('/admin/customers', { replace: true });
    } catch (err) {
      setError(err.message || 'Failed to delete customer(s)');
      setTimeout(() => setError(''), 5000);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteCustomer = (customer) => {
    openDeleteModal(customer, false);
  };

  const handleBulkDeleteCustomers = () => {
    if (selectedCustomerIds.length === 0) return;
    openDeleteModal(null, true);
  };

  const handleToggleSelectAll = () => {
    const allSelected = filteredCustomers.length > 0 && filteredCustomers.every((c) => selectedCustomerIds.includes(c._id));
    if (allSelected) {
      const filteredIds = new Set(filteredCustomers.map((c) => c._id));
      setSelectedCustomerIds((prev) => prev.filter((id) => !filteredIds.has(id)));
    } else {
      const newSelected = new Set(selectedCustomerIds);
      filteredCustomers.forEach((c) => newSelected.add(c._id));
      setSelectedCustomerIds(Array.from(newSelected));
    }
  };

  const handleToggleSelectCustomer = (id) => {
    setSelectedCustomerIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleClearSelection = () => {
    setSelectedCustomerIds([]);
  };

  // Sales Rep Form handlers
  const handleSaveSalesRep = async (e) => {
    e.preventDefault();
    setSalesRepFormError('');
    setSalesRepFormLoading(true);

    if (!salesRepFormData.name.trim()) {
      setSalesRepFormError('Name is required');
      setSalesRepFormLoading(false);
      return;
    }

    try {
      if (editingSalesRep) {
        const res = await api.put('/api/admin/sales-reps', {
          id: editingSalesRep._id,
          name: salesRepFormData.name.trim(),
        });
        setSalesReps((prev) => prev.map((s) => s._id === res.salesRep._id ? res.salesRep : s));
        setSuccessMsg(`Sales Representative "${res.salesRep.name}" updated successfully!`);
      } else {
        const res = await api.post('/api/admin/sales-reps', {
          name: salesRepFormData.name.trim(),
        });
        setSalesReps((prev) => [...prev, res.salesRep]);
        setSuccessMsg(`Sales Representative "${res.salesRep.name}" added successfully!`);
      }
      setIsSalesRepModalOpen(false);
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      setSalesRepFormError(err.message || 'Failed to save sales representative');
    } finally {
      setSalesRepFormLoading(false);
    }
  };

  const handleDeleteSalesRep = async (rep) => {
    const assignedCount = customers.filter(c => (c.salesRepId?._id || c.salesRepId) === rep._id).length;
    let confirmMsg = `Are you sure you want to delete sales representative "${rep.name}"?`;
    if (assignedCount > 0) {
      confirmMsg += `\nWarning: ${assignedCount} customer(s) are currently assigned to this representative. They will be unassigned (set to None).`;
    }
    if (!window.confirm(confirmMsg)) return;

    try {
      await api.delete(`/api/admin/sales-reps?id=${rep._id}`);
      setSalesReps((prev) => prev.filter((s) => s._id !== rep._id));
      setCustomers((prev) => prev.map(c => (c.salesRepId?._id || c.salesRepId) === rep._id ? { ...c, salesRepId: null } : c));
      setSuccessMsg('Sales representative deleted successfully!');
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      alert(err.message || 'Failed to delete sales representative');
    }
  };

  // Batch Form handlers
  const handleBatchInputChange = (e) => {
    const { name, value } = e.target;
    setBatchFormData((prev) => {
      const next = { ...prev, [name]: value };
      if (name === 'startDate') {
        next.endDate = formatDateStr(calculateEndDate(value, prev.durationMonths || 1));
      } else if (name === 'durationMonths') {
        const months = Math.max(1, parseInt(value, 10) || 1);
        next.endDate = formatDateStr(calculateEndDate(prev.startDate, months));
      }
      return next;
    });
  };

  const handleSelectMonths = (months) => {
    const m = Math.max(1, parseInt(months, 10) || 1);
    setBatchFormData((prev) => ({
      ...prev,
      durationMonths: m,
      endDate: formatDateStr(calculateEndDate(prev.startDate, m)),
    }));
  };

  const handleSaveBatch = async (e) => {
    e.preventDefault();
    setBatchFormError('');
    setBatchFormLoading(true);
    if (!batchFormData.name.trim()) {
      setBatchFormError('Batch name is required');
      setBatchFormLoading(false);
      return;
    }
    try {
      const payload = {
        name: batchFormData.name.trim(),
        startDate: batchFormData.startDate,
        durationMonths: Number(batchFormData.durationMonths) || 1,
        endDate: batchFormData.endDate,
      };

      if (editingBatch) {
        const res = await api.put('/api/admin/batches', {
          id: editingBatch._id,
          ...payload,
        });
        setBatches((prev) => prev.map((b) => b._id === res.batch._id ? res.batch : b));
        setSuccessMsg(`Batch "${res.batch.name}" updated successfully!`);
        fetchCustomers();
      } else {
        const res = await api.post('/api/admin/batches', payload);
        setBatches((prev) => [res.batch, ...prev]);
        setSuccessMsg(`Batch "${res.batch.name}" created successfully!`);
      }
      setIsBatchModalOpen(false);
      const todayStr = formatDateStr(new Date());
      setBatchFormData({
        name: '',
        startDate: todayStr,
        durationMonths: 1,
        endDate: formatDateStr(calculateEndDate(todayStr, 1)),
      });
      setEditingBatch(null);
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      setBatchFormError(err.message || 'Failed to save batch');
    } finally {
      setBatchFormLoading(false);
    }
  };

  const openDeleteBatchModal = (batch) => {
    setDeleteBatchModal({
      isOpen: true,
      batch,
      loading: false,
    });
  };

  const handleCloseDeleteBatchModal = () => {
    if (!deleteBatchModal.loading) {
      setDeleteBatchModal({ isOpen: false, batch: null, loading: false });
    }
  };

  const handleConfirmDeleteBatch = async () => {
    const batch = deleteBatchModal.batch;
    if (!batch) return;

    const enrolledCount = customers.filter(
      (c) => (c.batchId?._id || c.batchId) === batch._id
    ).length;

    // Condition: only batches without any customer can be deleted
    if (enrolledCount > 0) {
      setError(`Cannot delete batch "${batch.name}". It currently has ${enrolledCount} customer(s) enrolled. Only batches without any customers can be deleted.`);
      setTimeout(() => setError(''), 5000);
      setDeleteBatchModal({ isOpen: false, batch: null, loading: false });
      return;
    }

    setDeleteBatchModal((prev) => ({ ...prev, loading: true }));
    try {
      await api.delete(`/api/admin/batches?id=${batch._id}`);
      setBatches((prev) => prev.filter((b) => b._id !== batch._id));
      setSuccessMsg(`Batch "${batch.name}" deleted successfully!`);
      setTimeout(() => setSuccessMsg(''), 5000);
      setDeleteBatchModal({ isOpen: false, batch: null, loading: false });
    } catch (err) {
      setError(err.message || 'Failed to delete batch');
      setTimeout(() => setError(''), 5000);
      setDeleteBatchModal((prev) => ({ ...prev, loading: false }));
    }
  };

  // Package Form handlers
  const handlePackageInputChange = (e) => {
    const { name, value } = e.target;
    setPackageFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSavePackage = async (e) => {
    e.preventDefault();
    setPackageFormError('');
    setPackageFormLoading(true);
    if (!packageFormData.name.trim()) {
      setPackageFormError('Package name is required');
      setPackageFormLoading(false);
      return;
    }
    try {
      const payload = {
        name: packageFormData.name,
        description: packageFormData.description,
        items: packageFormData.items,
        price: packageFormData.price ? Number(packageFormData.price) : 0,
      };
      if (editingPackage) {
        payload.id = editingPackage._id;
        const res = await api.put('/api/admin/packages', payload);
        setPackages((prev) => prev.map((p) => p._id === res.package._id ? res.package : p));
        setSuccessMsg(`Package "${res.package.name}" updated successfully!`);
      } else {
        const res = await api.post('/api/admin/packages', payload);
        setPackages((prev) => [res.package, ...prev]);
        setSuccessMsg(`Package "${res.package.name}" created successfully!`);
      }
      setIsPackageModalOpen(false);
      setPackageFormData({
        name: '',
        description: '',
        items: '',
        price: '',
      });
      setEditingPackage(null);
      setTimeout(() => setSuccessMsg(''), 5000);
      fetchCustomers();
    } catch (err) {
      setPackageFormError(err.message || 'Failed to save package');
    } finally {
      setPackageFormLoading(false);
    }
  };

  const handleDeletePackage = async (pkg) => {
    if (pkg.name === 'Tester Pack') {
      alert('The "Tester Pack" package is seeded and cannot be deleted.');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete package "${pkg.name}"? This will unassign all customers from this package.`)) {
      return;
    }
    try {
      await api.delete(`/api/admin/packages?id=${pkg._id}`);
      setPackages((prev) => prev.filter((p) => p._id !== pkg._id));
      setSuccessMsg(`Package "${pkg.name}" deleted successfully.`);
      setTimeout(() => setSuccessMsg(''), 5000);
      fetchCustomers();
    } catch (err) {
      setError(err.message || 'Failed to delete package');
      setTimeout(() => setError(''), 5000);
    }
  };
  // Tickets Handlers
  const handleTicketInputChange = (e) => {
    const { name, value } = e.target;
    setTicketFormData((prev) => ({ ...prev, [name]: value }));
  };

  const openCreateTicketModal = () => {
    setEditingTicket(null);
    setTicketFormData({
      name: '',
      phone: '',
      email: '',
      enquiry: '',
      requestedConsultations: '',
      dueDate: '',
      status: 'new ticket',
    });
    setTicketFormError('');
    setIsTicketModalOpen(true);
  };

  const openEditTicketModal = (ticket) => {
    setEditingTicket(ticket);
    setTicketFormData({
      name: ticket.customerDetails?.name || '',
      phone: ticket.customerDetails?.phone || '',
      email: ticket.customerDetails?.email || '',
      enquiry: ticket.enquiry || '',
      requestedConsultations: ticket.requestedConsultations || '',
      dueDate: ticket.dueDate ? new Date(ticket.dueDate).toISOString().split('T')[0] : '',
      status: ticket.status || 'new ticket',
    });
    setTicketFormError('');
    setIsTicketModalOpen(true);
  };

  const handleSaveTicket = async (e) => {
    e.preventDefault();
    setTicketFormError('');
    setTicketFormLoading(true);

    if (!ticketFormData.name.trim() || !ticketFormData.phone.trim() || !ticketFormData.enquiry.trim()) {
      setTicketFormError('Name, Phone, and Enquiry Details are required');
      setTicketFormLoading(false);
      return;
    }

    try {
      if (editingTicket) {
        const res = await api.put('/api/admin/tickets', {
          id: editingTicket._id,
          ...ticketFormData,
        });
        setTickets((prev) => prev.map((t) => t._id === res.ticket._id ? res.ticket : t));
        setSuccessMsg('Enquiry ticket updated successfully!');
      } else {
        const res = await api.post('/api/admin/tickets', ticketFormData);
        setTickets((prev) => [res.ticket, ...prev]);
        setSuccessMsg('Enquiry ticket created successfully!');
      }
      setIsTicketModalOpen(false);
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      setTicketFormError(err.message || 'Failed to save enquiry ticket');
    } finally {
      setTicketFormLoading(false);
    }
  };

  const handleUpdateTicketStatus = async (ticketId, newStatus) => {
    try {
      const res = await api.put('/api/admin/tickets', { id: ticketId, status: newStatus });
      setTickets((prev) => prev.map((t) => t._id === ticketId ? res.ticket : t));
    } catch (err) {
      console.error(err);
      setError('Failed to update ticket status: ' + err.message);
    }
  };

  const handleDeleteTicket = async (ticketId) => {
    if (!window.confirm('Are you sure you want to delete this enquiry ticket?')) return;
    try {
      await api.delete(`/api/admin/tickets?id=${ticketId}`);
      setTickets((prev) => prev.filter((t) => t._id !== ticketId));
      setSuccessMsg('Enquiry ticket deleted successfully.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to delete ticket');
    }
  };

  // Customer Profile & Task Viewer Handlers
  const openTaskViewer = async (customer) => {
    setTaskViewerCustomer(customer);
    setCustomerTasks([]);
    setTasksLoading(true);
    setSelectedTaskDay(null);
    setProfileSubTab('overview');
    try {
      const data = await api.get(`/api/admin/customer-tasks?userId=${customer._id}`);
      setCustomerTasks(data.logs || []);
    } catch (err) {
      console.error('Failed to fetch customer tasks:', err);
    } finally {
      setTasksLoading(false);
    }
  };

  const handleUpdateTaskLog = async (dayNumber, taskId, completed, amount) => {
    if (!taskViewerCustomer) return;
    try {
      const res = await api.put('/api/admin/customer-tasks', {
        userId: taskViewerCustomer._id,
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

  const getCurrentDayNumberLocal = (startDate, totalDays) => getCurrentDayNumber(startDate, totalDays);

  function getBatchTimelineInfo(b) {
    if (!b?.startDate) return { start: null, end: null, totalDays: 30, durationMonths: 1 };
    const start = parseLocalDate(b.startDate);
    if (!start || isNaN(start.getTime())) {
      return { start: null, end: null, totalDays: 30, durationMonths: 1 };
    }
    start.setHours(0, 0, 0, 0);
    const months = b.durationMonths || 1;
    let end;
    if (b.endDate) {
      end = parseLocalDate(b.endDate);
    } else {
      end = calculateEndDate(start, months);
    }
    if (!end || isNaN(end.getTime())) {
      end = calculateEndDate(start, 1) || new Date(start.getTime() + 30 * 86400000);
    }
    end.setHours(23, 59, 59, 999);
    const totalDays = b.totalDays || calculateTotalDays(start, end);
    return { start, end, totalDays, durationMonths: months };
  }

  // Stats Calculations for selected profile
  const stats = getCustomerStats(customerTasks, taskViewerCustomer);

  // Global calculations
  const totalCount = customers.length;
  const ageCustomers = customers.filter((c) => typeof c.age === 'number' && c.age > 0);
  const avgAge = ageCustomers.length
    ? Math.round(ageCustomers.reduce((acc, c) => acc + c.age, 0) / ageCustomers.length)
    : 0;

  // Batch lifecycle metrics (defined timeframe)
  const todayDate = new Date();
  const startOfToday = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate());

  const completedBatches = batches.filter((b) => {
    const { end } = getBatchTimelineInfo(b);
    if (!end) return false;
    return startOfToday > end;
  });

  const activeBatches = batches.filter((b) => {
    const { start, end } = getBatchTimelineInfo(b);
    if (!start || !end) return true;
    return startOfToday >= start && startOfToday <= end;
  });

  const upcomingBatches = batches.filter((b) => {
    const { start } = getBatchTimelineInfo(b);
    if (!start) return false;
    return start > startOfToday;
  });

  const openTicketsCount = tickets.filter((t) => t.status !== 'completed').length;

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

    const customerBatch = batches.find((b) => b._id === (user.batchId?._id || user.batchId)) || user.batchId;
    const customerTotalDays = getBatchTimelineInfo(customerBatch || user).totalDays || 30;
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

  // Filtered Lists
  const filteredCustomers = customers.filter(
    (c) =>
      ((c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.phone || '').includes(searchQuery)) &&
      (selectedBatchFilter ? (c.batchId?._id || c.batchId) === selectedBatchFilter : true)
  );

  return (
    <div className="min-h-screen bg-[#FDF9F7] text-gray-900 flex flex-col md:flex-row">
      {/* Universal Admin Sidebar */}
      <AdminSidebar
        activeTab={activeTab}
        isMobileSidebarOpen={isMobileSidebarOpen}
        setIsMobileSidebarOpen={setIsMobileSidebarOpen}
        customerCount={totalCount}
        activeBatchesCount={activeBatches.length}
        openTicketsCount={openTicketsCount}
      />

      {/* Main Right Content Section */}
      <div className="flex-1 flex flex-col md:h-screen md:overflow-y-auto">
        {/* Sticky Mobile Top Header */}
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-2xl border-b border-black/[0.05] px-4 py-3 flex items-center justify-between md:px-8 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="p-1.5 text-[#86868B] hover:text-[#1D1D1F] md:hidden hover:bg-black/[0.04] rounded-lg border border-black/[0.06]"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h2 className="font-display font-bold text-sm md:text-base text-[#1D1D1F] tracking-tight capitalize">
              {activeTab === 'onboarding' ? 'Customer Onboarding' : activeTab === 'batches' ? 'Batches Management' : activeTab === 'meetings' ? 'Live Meetings Management' : activeTab === 'tickets' ? 'Enquiry Tickets' : activeTab === 'packages' ? 'Packages Management' : activeTab === 'salesreps' ? 'Sales Reps (Telecallers)' : activeTab === 'recorded-video' ? 'Recorded Video' : activeTab === 'customers' ? 'Customers Directory' : activeTab}
            </h2>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden sm:inline text-xs font-medium text-[#86868B]">
              Welcome, <span className="text-[#1D1D1F] font-semibold">{adminUser?.name || 'Administrator'}</span>
            </span>
            <div className="w-8 h-8 rounded-full bg-[#00A86B]/10 text-[#00A86B] font-display font-semibold text-xs flex items-center justify-center sm:hidden border border-[#00A86B]/20 shadow-2xs" title={adminUser?.name || 'Administrator'}>
              {(adminUser?.name || 'A').charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-3.5 sm:p-5 md:p-8 max-w-7xl w-full mx-auto">
          {/* Alerts Banner */}
          {successMsg && (
            <div className="flex items-center gap-3 bg-[#34C759]/10 border border-[#34C759]/20 rounded-2xl p-4 mb-6 text-sm text-[#1C962F] animate-scale-in">
              <svg className="w-5 h-5 shrink-0 text-[#34C759]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-semibold">{successMsg}</span>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-3 bg-[#FF3B30]/10 border border-[#FF3B30]/20 rounded-2xl p-4 mb-6 text-sm text-[#FF3B30] animate-scale-in">
              <svg className="w-5 h-5 shrink-0 text-[#FF3B30]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-semibold">{error}</span>
            </div>
          )}

          {/* Tab Views */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 sm:space-y-8 animate-scale-in">
              {/* 4 KPIs Only: Mobile-First 2x2 grid on mobile phones, 4 cols on desktop */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                {/* KPI 1: Total Clients */}
                <div
                  onClick={() => navigate('/admin/customers')}
                  role="button"
                  tabIndex={0}
                  className="bg-white rounded-[20px] p-4 sm:p-5 border border-black/[0.06] shadow-sm hover:shadow-md hover:border-black/[0.1] active:scale-[0.98] transition-all cursor-pointer flex flex-col justify-between group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-[#86868B] font-semibold uppercase tracking-wider truncate">Total Clients</span>
                    <span className="p-2 bg-[#00A86B]/10 text-[#00A86B] rounded-full group-hover:bg-[#00A86B]/15 transition-colors shrink-0">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </span>
                  </div>
                  <div className="mt-2 sm:mt-4">
                    <h3 className="font-display font-bold text-2xl sm:text-3xl text-[#1D1D1F] tracking-tight">{totalCount}</h3>
                    <div className="flex items-center gap-1.5 sm:gap-2 mt-1 sm:mt-2 text-[11px] text-[#86868B] font-medium truncate">
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0071E3] shrink-0"></span>
                        {customers.filter(c => c.gender === 'male').length} Male
                      </span>
                      <span className="text-gray-300">·</span>
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#FF2D55] shrink-0"></span>
                        {customers.filter(c => c.gender === 'female').length} Female
                      </span>
                    </div>
                  </div>
                </div>

                {/* KPI 2: Active Batches */}
                <div
                  onClick={() => navigate('/admin/batches')}
                  role="button"
                  tabIndex={0}
                  className="bg-white rounded-[20px] p-4 sm:p-5 border border-black/[0.06] shadow-sm hover:shadow-md hover:border-black/[0.1] active:scale-[0.98] transition-all cursor-pointer flex flex-col justify-between group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-[#86868B] font-semibold uppercase tracking-wider truncate">Active Batches</span>
                    <span className="p-2 bg-[#34C759]/10 text-[#34C759] rounded-full group-hover:bg-[#34C759]/15 transition-colors shrink-0">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </span>
                  </div>
                  <div className="mt-2 sm:mt-4">
                    <h3 className="font-display font-bold text-2xl sm:text-3xl text-[#1D1D1F] tracking-tight">{activeBatches.length}</h3>
                    <p className="text-[11px] text-[#34C759] font-medium mt-1 sm:mt-2 truncate">
                      {activeBatches.length === 1 ? '1 ongoing challenge' : `${activeBatches.length} ongoing challenges`}
                      {upcomingBatches.length > 0 && (
                        <span className="text-[#86868B] font-normal"> · {upcomingBatches.length} upcoming</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* KPI 3: Tickets */}
                <div
                  onClick={() => navigate('/admin/tickets')}
                  role="button"
                  tabIndex={0}
                  className="bg-white rounded-[20px] p-4 sm:p-5 border border-black/[0.06] shadow-sm hover:shadow-md hover:border-black/[0.1] active:scale-[0.98] transition-all cursor-pointer flex flex-col justify-between group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-[#86868B] font-semibold uppercase tracking-wider truncate">Tickets</span>
                    <span className="p-2 bg-[#FF9500]/10 text-[#FF9500] rounded-full group-hover:bg-[#FF9500]/15 transition-colors shrink-0">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                      </svg>
                    </span>
                  </div>
                  <div className="mt-2 sm:mt-4">
                    <h3 className="font-display font-bold text-2xl sm:text-3xl text-[#1D1D1F] tracking-tight">{openTicketsCount}</h3>
                    <p className="text-[11px] text-[#FF9500] font-medium mt-1 sm:mt-2 truncate">
                      {openTicketsCount === 0 ? 'All tickets resolved' : `${openTicketsCount} pending inquiries`}
                    </p>
                  </div>
                </div>

                {/* KPI 4: Completed Batch */}
                <div
                  onClick={() => navigate('/admin/batches')}
                  role="button"
                  tabIndex={0}
                  className="bg-white rounded-[20px] p-4 sm:p-5 border border-black/[0.06] shadow-sm hover:shadow-md hover:border-black/[0.1] active:scale-[0.98] transition-all cursor-pointer flex flex-col justify-between group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-[#86868B] font-semibold uppercase tracking-wider truncate">Completed Batch</span>
                    <span className="p-2 bg-[#5856D6]/10 text-[#5856D6] rounded-full group-hover:bg-[#5856D6]/15 transition-colors shrink-0">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </span>
                  </div>
                  <div className="mt-2 sm:mt-4">
                    <h3 className="font-display font-bold text-2xl sm:text-3xl text-[#1D1D1F] tracking-tight">{completedBatches.length}</h3>
                    <p className="text-[11px] text-[#5856D6] font-medium mt-1 sm:mt-2 truncate">
                      {completedBatches.length === 1 ? '1 batch finished' : `${completedBatches.length} batches finished`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Batch Capacity Overview Section */}
              <div className="bg-white rounded-2xl sm:rounded-3xl border border-border p-4 sm:p-6 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
                  <div>
                    <h3 className="font-display font-extrabold text-sm sm:text-base text-gray-900">Batch Capacity Overview</h3>
                    <p className="text-xs text-muted mt-0.5">Enrolled customers and active progress per batch program.</p>
                  </div>
                  <button
                    onClick={() => navigate('/admin/batches')}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-xl transition-colors w-fit shrink-0 self-start sm:self-auto"
                  >
                    <span>Manage Batches</span>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {batches.map((batch) => {
                    const count = customers.filter(c => {
                      const cBatchId = c.batchId?._id || c.batchId;
                      return cBatchId === batch._id;
                    }).length;
                    const { start: batchStart, end: batchEnd, totalDays } = getBatchTimelineInfo(batch);
                    const diffDays = Math.floor((startOfToday - batchStart) / (1000 * 60 * 60 * 24));
                    const isCompleted = startOfToday > batchEnd;
                    const isOngoing = startOfToday >= batchStart && startOfToday <= batchEnd;

                    return (
                      <div key={batch._id} className="p-3.5 sm:p-4 rounded-2xl bg-gray-50/70 border border-gray-100 flex flex-col justify-between gap-3 hover:border-brand-200 transition-all">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs sm:text-sm font-extrabold text-gray-800 truncate">{batch.name}</p>
                            <p className="text-[10px] text-muted font-bold mt-0.5">Starts: {format(new Date(batch.startDate), 'MMM dd, yyyy')}</p>
                          </div>
                          <span className={`px-2 py-0.5 text-[10px] font-extrabold uppercase rounded-lg shrink-0 border ${
                            isCompleted
                              ? 'bg-gray-100 text-gray-600 border-gray-200'
                              : isOngoing
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {isCompleted ? 'Completed' : isOngoing ? `Day ${diffDays + 1}/${totalDays}` : 'Upcoming'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-gray-200/60">
                          <span className="text-[11px] font-bold text-gray-500">Enrolled Members</span>
                          <span className="px-2.5 py-1 bg-white text-gray-800 border border-gray-200 rounded-xl text-xs font-black shadow-xs">
                            {count} {count === 1 ? 'customer' : 'customers'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  {/* Tester Pack (No Batch) */}
                  {(() => {
                    const testerCount = customers.filter(c => {
                      const cPkgName = c.packageId?.name || (packages.find(p => p._id === (c.packageId?._id || c.packageId))?.name);
                      return cPkgName === 'Tester Pack' || (c.packageId && !c.batchId);
                    }).length;
                    return (
                      <div className="p-3.5 sm:p-4 rounded-2xl bg-gray-50/70 border border-gray-100 flex flex-col justify-between gap-3 hover:border-brand-200 transition-all">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs sm:text-sm font-extrabold text-gray-800 truncate">Tester Pack / No Batch</p>
                            <p className="text-[10px] text-muted font-bold mt-0.5">Individual Start Mode</p>
                          </div>
                          <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase rounded-lg shrink-0 border bg-blue-50 text-blue-700 border-blue-200">
                            Flexible
                          </span>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-gray-200/60">
                          <span className="text-[11px] font-bold text-gray-500">Enrolled Members</span>
                          <span className="px-2.5 py-1 bg-white text-gray-800 border border-gray-200 rounded-xl text-xs font-black shadow-xs">
                            {testerCount} {testerCount === 1 ? 'customer' : 'customers'}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'customers' && (
          <div className="space-y-5">
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-2.5 flex-1 max-w-2xl">
                <div className="relative flex-1">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    placeholder="Search by name or phone number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-border bg-white text-xs focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-500 transition-all text-gray-900 shadow-2xs"
                  />
                </div>
                <select
                  value={selectedBatchFilter}
                  onChange={(e) => setSelectedBatchFilter(e.target.value)}
                  className="rounded-xl border border-border bg-white px-3 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-500 transition-all text-gray-800 shadow-2xs"
                >
                  <option value="">All Batches</option>
                  {batches.map((b) => (
                    <option key={b._id} value={b._id}>{b.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <h2 className="font-display font-extrabold text-sm sm:text-base text-gray-900">Directory</h2>
                  <span className="px-2 py-0.5 bg-brand-50 text-brand-700 text-[11px] font-bold rounded-md border border-brand-100">
                    {filteredCustomers.length} match(es)
                  </span>
                </div>

                {selectedCustomerIds.length > 0 && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200/70 px-3 py-1.5 rounded-xl animate-scale-in">
                    <span className="text-[11px] font-bold text-red-900">
                      {selectedCustomerIds.length} selected
                    </span>
                    <button
                      type="button"
                      onClick={handleClearSelection}
                      className="text-[11px] font-semibold text-gray-500 hover:text-gray-800 transition-colors px-1 py-0.5"
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      onClick={handleBulkDeleteCustomers}
                      className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1.5 shadow-2xs transition-all"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete Selected ({selectedCustomerIds.length})
                    </button>
                  </div>
                )}
              </div>

              {loading ? (
                <div className="p-5 space-y-3">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="flex items-center gap-3 py-2">
                      <div className="w-9 h-9 rounded-xl skeleton shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3.5 w-1/4 skeleton" />
                        <div className="h-2.5 w-1/3 skeleton" />
                      </div>
                      <div className="h-7 w-16 skeleton shrink-0" />
                    </div>
                  ))}
                </div>
              ) : filteredCustomers.length === 0 ? (
                <div className="p-10 text-center">
                  <h3 className="font-display font-bold text-gray-900 text-sm mb-1">No customers found</h3>
                  <p className="text-xs text-gray-500">Adjust search or filters above.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="bg-gradient-to-r from-brand-50/40 to-transparent border-b border-border">
                        <th className="w-10 px-3 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={filteredCustomers.length > 0 && filteredCustomers.every((c) => selectedCustomerIds.includes(c._id))}
                            ref={(el) => {
                              if (el) {
                                const someSelected = filteredCustomers.some((c) => selectedCustomerIds.includes(c._id));
                                const allSelected = filteredCustomers.length > 0 && filteredCustomers.every((c) => selectedCustomerIds.includes(c._id));
                                el.indeterminate = someSelected && !allSelected;
                              }
                            }}
                            onChange={handleToggleSelectAll}
                            className="w-3.5 h-3.5 rounded border-gray-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                            title="Select all customers"
                          />
                        </th>
                        <th className="w-12 px-2.5 py-3 text-[11px] font-extrabold text-gray-500 uppercase tracking-wider text-center">#</th>
                        <th className="px-4 py-3 text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-4 py-3 text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Phone</th>
                        <th className="px-4 py-3 text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Package</th>
                        <th className="px-4 py-3 text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Batch</th>
                        <th className="px-4 py-3 text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Telecaller</th>
                        <th className="px-4 py-3 text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Joined Date</th>
                        <th className="px-4 py-3 text-[11px] font-extrabold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredCustomers.map((customer, index) => {
                        const isSelected = selectedCustomerIds.includes(customer._id);
                        const initials = customer.name
                          ?.split(' ')
                          .filter(Boolean)
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase() || '?';

                        return (
                          <tr
                            key={customer._id}
                            className={`hover:bg-brand-50/20 transition-colors ${
                              isSelected ? 'bg-brand-50/40' : ''
                            }`}
                          >
                            <td className="w-10 px-3 py-2.5 text-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleSelectCustomer(customer._id)}
                                className="w-3.5 h-3.5 rounded border-gray-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                                title={`Select ${customer.name}`}
                              />
                            </td>
                            <td className="w-12 px-2.5 py-2.5 text-center whitespace-nowrap text-[11px] font-mono font-bold text-gray-400">
                              {index + 1}
                            </td>
                            <td className="px-4 py-2.5 whitespace-nowrap">
                              <div className="flex items-center gap-2.5">
                                <Link
                                  to={`/admin/customer/${customer._id}`}
                                  className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-100 to-brand-200 text-brand-800 flex items-center justify-center font-display font-black text-[11px] border border-brand-200/60 shadow-2xs shrink-0 hover:scale-105 transition-transform"
                                  title={`View ${customer.name}'s details`}
                                >
                                  {initials}
                                </Link>
                                <Link
                                  to={`/admin/customer/${customer._id}`}
                                  className="font-display font-bold text-gray-950 text-xs sm:text-[13px] hover:text-brand-600 text-left transition-colors truncate max-w-[180px] sm:max-w-xs block"
                                  title={`View ${customer.name}'s details`}
                                >
                                  {customer.name}
                                </Link>
                              </div>
                            </td>
                            <td className="px-4 py-2.5 whitespace-nowrap text-[11px] text-gray-600 font-mono font-semibold">
                              {customer.phone}
                            </td>
                            <td className="px-4 py-2.5 whitespace-nowrap">
                              {customer.packageId?.name ? (
                                <span className="px-2 py-0.5 bg-amber-50 text-amber-800 text-[10px] font-bold rounded-md border border-amber-200/60 uppercase tracking-wide">
                                  📦 {customer.packageId.name}
                                </span>
                              ) : (
                                <span className="text-gray-400 text-[11px] font-medium italic">None</span>
                              )}
                            </td>
                            <td className="px-4 py-2.5 whitespace-nowrap">
                              {customer.batchId?.name ? (
                                <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-[10px] font-bold rounded-md border border-gray-200">
                                  {customer.batchId.name}
                                </span>
                              ) : (
                                <span className="text-gray-400 text-[11px] font-medium italic">No Batch</span>
                              )}
                            </td>
                            <td className="px-4 py-2.5 whitespace-nowrap">
                              {customer.salesRepId?.name ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-brand-50/70 text-brand-800 text-[10px] font-bold rounded-md border border-brand-100">
                                  👤 {customer.salesRepId.name}
                                </span>
                              ) : (
                                <span className="text-gray-400 text-[11px] font-medium italic">—</span>
                              )}
                            </td>
                            <td className="px-4 py-2.5 whitespace-nowrap text-[11px] text-gray-500 font-medium font-mono">
                              {customer.joinedDate || customer.createdAt ? new Date(customer.joinedDate || customer.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                            </td>
                            <td className="px-4 py-2.5 whitespace-nowrap text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Link
                                  to={`/admin/customer/${customer._id}?tab=videos`}
                                  className="px-2 py-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/70 rounded-lg transition-colors inline-flex items-center gap-1"
                                  title={`Upload or manage personalised videos for ${customer.name}`}
                                >
                                  <span>🎥</span>
                                  <span>+ Video</span>
                                </Link>
                                <Link
                                  to={`/admin/customer/${customer._id}`}
                                  className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors inline-flex items-center justify-center"
                                  title={`View ${customer.name}'s details`}
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                </Link>
                                <button
                                  onClick={() => handleDeleteCustomer(customer)}
                                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title={`Delete ${customer.name}`}
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Customer Onboarding CRM Page */}
        {activeTab === 'onboarding' && (
          <div className="space-y-8 animate-fade-in">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-brand-50 to-white rounded-3xl border border-brand-100 p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-brand-700 bg-brand-100/60 border border-brand-200 px-2.5 py-1 rounded-lg">CRM Lead Portal</span>
                <h2 className="font-display font-extrabold text-xl md:text-2xl text-gray-900 mt-2">New Customer Registration</h2>
                <p className="text-xs text-muted mt-1 max-w-xl">Register customer profiles, assign them to active wellness challenge batches, and allocate sales reps/telecallers.</p>
              </div>
            </div>

            {/* Registration Form Card */}
            <div className="bg-white rounded-3xl border border-border p-6 md:p-8 shadow-sm">
              <h3 className="font-display font-extrabold text-lg text-gray-900 mb-1">Onboarding & Profile Form</h3>
              <p className="text-xs text-muted mb-6">Fill in customer credentials, package assignment, and telecaller details below.</p>

              {formError && (
                <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center justify-between animate-fade-in">
                  <span>{formError}</span>
                  <button type="button" onClick={() => setFormError('')} className="text-red-500 hover:text-red-700 font-bold ml-2">✕</button>
                </div>
              )}

              <form onSubmit={handleSubmitForm} autoComplete="off" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5 px-1">Full Name *</label>
                    <input
                      type="text"
                      name="name"
                      required
                      autoComplete="off"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="e.g. Martha Stewart"
                      className="w-full rounded-2xl border border-border bg-[#FAFAFA] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-500 transition-all text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5 px-1">Phone Number *</label>
                    <input
                      type="tel"
                      name="phone"
                      required
                      autoComplete="off"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="e.g. 9876543210"
                      className="w-full rounded-2xl border border-border bg-[#FAFAFA] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-500 transition-all text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5 px-1">Temporary Password *</label>
                    <input
                      type="password"
                      name="password"
                      required
                      autoComplete="new-password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Assign user password"
                      className="w-full rounded-2xl border border-border bg-[#FAFAFA] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-500 transition-all text-gray-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5 px-1">Assign Package *</label>
                    <select
                      name="packageId"
                      required
                      value={formData.packageId}
                      onChange={handleInputChange}
                      className="w-full rounded-2xl border border-border bg-[#FAFAFA] px-3.5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-500 transition-all text-gray-900"
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
                    <label className="block text-xs font-bold text-gray-700 mb-1.5 px-1">Assign Batch *</label>
                    <select
                      name="batchId"
                      required
                      value={formData.batchId}
                      onChange={handleInputChange}
                      disabled={packages.find(p => p._id === formData.packageId)?.name === 'Tester Pack'}
                      className="w-full rounded-2xl border border-border bg-[#FAFAFA] px-3.5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-500 transition-all text-gray-900 disabled:opacity-75 disabled:bg-gray-100"
                    >
                      <option value="" disabled>Select a Batch</option>
                      <option value="NONE">NONE (Tester Pack / Starts manually)</option>
                      {batches.map((b) => {
                        const isStarted = new Date(b.startDate) <= new Date();
                        return (
                          <option key={b._id} value={b._id}>
                            {b.name} (Starts {new Date(b.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}){isStarted ? ' - Active' : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5 px-1">Assign Telecaller (Sales Rep)</label>
                    <select
                      name="salesRepId"
                      value={formData.salesRepId}
                      onChange={handleInputChange}
                      className="w-full rounded-2xl border border-border bg-[#FAFAFA] px-3.5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-500 transition-all text-gray-900"
                    >
                      <option value="">None (Unassigned)</option>
                      {salesReps.map((rep) => (
                        <option key={rep._id} value={rep._id}>
                          {rep.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5 px-1">Age</label>
                    <input
                      type="number"
                      name="age"
                      value={formData.age}
                      onChange={handleInputChange}
                      placeholder="e.g. 62"
                      className="w-full rounded-2xl border border-border bg-[#FAFAFA] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-500 transition-all text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5 px-1">Height (cm)</label>
                    <input
                      type="number"
                      name="heightCm"
                      value={formData.heightCm}
                      onChange={handleInputChange}
                      placeholder="e.g. 165"
                      className="w-full rounded-2xl border border-border bg-[#FAFAFA] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-500 transition-all text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5 px-1">Weight (kg)</label>
                    <input
                      type="number"
                      name="weightKg"
                      value={formData.weightKg}
                      onChange={handleInputChange}
                      placeholder="e.g. 68"
                      className="w-full rounded-2xl border border-border bg-[#FAFAFA] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-500 transition-all text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5 px-1">Gender</label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="w-full rounded-2xl border border-border bg-[#FAFAFA] px-3.5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-500 transition-all text-gray-900"
                    >
                      <option value="" disabled>Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="w-full md:w-auto px-8 btn-brand py-3.5 rounded-2xl font-bold text-sm text-white shadow-brand hover:scale-[1.01] transition-all flex items-center justify-center gap-2"
                  >
                    {formLoading ? 'Onboarding Customer...' : 'Onboard & Register Customer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Tab 3: Batches Management Page */}
        {activeTab === 'batches' && (
          <div className="space-y-8 animate-fade-in">
            {/* Header & Stats Banner */}
            <div className="bg-white rounded-3xl border border-border p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <h2 className="font-display font-extrabold text-xl text-gray-900">Wellness Class Batches</h2>
                <p className="text-xs text-muted mt-1">Manage challenge start dates, timeframes, and track enrolled members across active and upcoming batches.</p>
              </div>
              <button
                onClick={() => {
                  setEditingBatch(null);
                  const todayStr = formatDateStr(new Date());
                  setBatchFormData({
                    name: '',
                    startDate: todayStr,
                    durationMonths: 1,
                    endDate: formatDateStr(calculateEndDate(todayStr, 1)),
                  });
                  setIsBatchModalOpen(true);
                }}
                className="px-5 py-3 bg-brand-600 hover:bg-brand-700 text-white text-xs font-extrabold rounded-2xl shadow-brand flex items-center gap-2 transition-all"
              >
                <span>+ Create New Batch</span>
              </button>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-3xl border border-border shadow-sm">
                <span className="text-xs font-bold text-muted">Total Batches</span>
                <p className="text-2xl font-display font-black text-gray-900 mt-1">{batches.length}</p>
              </div>
              <div className="bg-white p-5 rounded-3xl border border-border shadow-sm">
                <span className="text-xs font-bold text-muted">Active Batches</span>
                <p className="text-2xl font-display font-black text-brand-600 mt-1">
                  {activeBatches.length}
                </p>
              </div>
              <div className="bg-white p-5 rounded-3xl border border-border shadow-sm">
                <span className="text-xs font-bold text-muted">Upcoming Batches</span>
                <p className="text-2xl font-display font-black text-amber-600 mt-1">
                  {upcomingBatches.length}
                </p>
              </div>
              <div className="bg-white p-5 rounded-3xl border border-border shadow-sm">
                <span className="text-xs font-bold text-muted">Total Enrolled</span>
                <p className="text-2xl font-display font-black text-gray-900 mt-1">
                  {customers.filter(c => c.batchId).length}
                </p>
              </div>
            </div>

            {/* Batches Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {batches.length === 0 ? (
                <div className="col-span-full text-center p-12 bg-white rounded-3xl border border-border text-xs text-gray-400">
                  No batches defined yet. Click "+ Create New Batch" to add one.
                </div>
              ) : (
                batches.map((batch) => {
                  const { start: batchStart, end: batchEnd, totalDays, durationMonths } = getBatchTimelineInfo(batch);
                  const isStarted = startOfToday >= batchStart && startOfToday <= batchEnd;
                  const isCompleted = startOfToday > batchEnd;
                  const isUpcoming = startOfToday < batchStart;
                  const enrolledCount = customers.filter(c => c.batchId?._id === batch._id || c.batchId === batch._id).length;
                  return (
                    <div key={batch._id} className="bg-white rounded-3xl border border-border p-6 shadow-sm hover:border-brand-300 transition-all flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="font-display font-black text-base text-gray-900">{batch.name}</h4>
                          <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
                            isCompleted
                              ? 'bg-gray-100 text-gray-600 border-gray-200'
                              : isStarted
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {isCompleted ? 'Completed' : isStarted ? 'Active / Running' : 'Upcoming'}
                          </span>
                        </div>
                        <div className="space-y-1 text-xs text-muted">
                          <p>
                            Start Date: <span className="font-bold text-gray-800">{new Date(batch.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          </p>
                          <p>
                            End Date: <span className="font-bold text-gray-800">{batchEnd ? format(new Date(batchEnd), 'MMM dd, yyyy') : '-'}</span>
                          </p>
                          <p>
                            Timeframe: <span className="font-bold text-brand-700">{durationMonths} Month{durationMonths > 1 ? 's' : ''} ({totalDays} Days)</span>
                          </p>
                        </div>
                        <div className="mt-4 pt-4 border-t border-border">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-700">Enrolled Customers</span>
                            <span className="px-2.5 py-1 bg-brand-50 text-brand-700 text-xs font-black rounded-lg border border-brand-100">
                              {enrolledCount} Members
                            </span>
                          </div>
                          {enrolledCount === 0 ? (
                            <span className="text-[10px] text-emerald-600 font-bold mt-1.5 inline-flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                              ✓ 0 customers · Eligible for deletion
                            </span>
                          ) : (
                            <span className="text-[10px] text-amber-700 font-semibold mt-1.5 inline-flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
                              🔒 Has {enrolledCount} customer(s) · Cannot be deleted
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mt-6 pt-4 border-t border-border flex items-center justify-between gap-2">
                        <button
                          onClick={() => setViewingBatchMembers(batch)}
                          className="flex-1 py-2 text-xs font-bold text-gray-700 hover:text-brand-700 bg-gray-50 hover:bg-brand-50 border border-border hover:border-brand-200 rounded-xl transition-colors text-center"
                        >
                          View Members
                        </button>
                        <button
                          onClick={() => {
                            setEditingBatch(batch);
                            const startStr = formatDateStr(batch.startDate);
                            const months = batch.durationMonths || 1;
                            const endStr = batch.endDate ? formatDateStr(batch.endDate) : formatDateStr(calculateEndDate(startStr, months));
                            setBatchFormData({
                              name: batch.name,
                              startDate: startStr,
                              durationMonths: months,
                              endDate: endStr,
                            });
                            setIsBatchModalOpen(true);
                          }}
                          className="px-3.5 py-2 text-xs font-bold text-brand-600 hover:text-brand-700 bg-white border border-brand-200 hover:bg-brand-50 rounded-xl transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => openDeleteBatchModal(batch)}
                          disabled={enrolledCount > 0}
                          title={
                            enrolledCount > 0
                              ? `Cannot delete: ${enrolledCount} customer(s) enrolled. Only batches without any customers can be deleted.`
                              : `Delete batch "${batch.name}"`
                          }
                          className={`px-3 py-2 text-xs font-bold rounded-xl border transition-all flex items-center gap-1.5 ${
                            enrolledCount > 0
                              ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-60'
                              : 'bg-white hover:bg-red-50 text-red-600 hover:text-red-700 border-red-200 shadow-sm'
                          }`}
                        >
                          <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Tab: Packages Management */}
        {activeTab === 'packages' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-scale-in">
            {/* Left Panel: Packages list */}
            <div className="lg:col-span-12 space-y-6">
              <div className="bg-white rounded-3xl border border-border p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="font-display font-extrabold text-base text-gray-900">Dynamic Packages</h2>
                    <p className="text-xs text-muted mt-0.5">Manage wellness packages, details, and items assigned to customers.</p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingPackage(null);
                      setPackageFormData({ name: '', description: '', items: '', price: '' });
                      setPackageFormError('');
                      setIsPackageModalOpen(true);
                    }}
                    className="btn-brand px-4 py-2.5 rounded-xl flex items-center gap-1.5 text-xs shadow-brand"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Create Package
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {packages.map((pkg) => (
                    <div
                      key={pkg._id}
                      className="p-5 rounded-3xl border border-border hover:border-brand-200 hover:shadow-md transition-all bg-[#FAFAFA] flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <h3 className="font-display font-extrabold text-sm text-gray-900">{pkg.name}</h3>
                            <p className="text-xs font-mono font-extrabold text-brand-500 mt-1">₹{pkg.price || 0}</p>
                          </div>
                          <span className="px-2 py-0.5 bg-brand-50 text-brand-700 text-[10px] font-bold rounded-lg border border-brand-100 whitespace-nowrap">
                            {pkg.customerCount || 0} active user(s)
                          </span>
                        </div>
                        {pkg.description && (
                          <p className="text-xs text-gray-500 leading-relaxed">{pkg.description}</p>
                        )}
                        {pkg.items && pkg.items.length > 0 && (
                          <div className="space-y-1.5">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Package Items</p>
                            <div className="flex flex-wrap gap-1">
                              {pkg.items.map((item, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 bg-white text-gray-600 border border-gray-200 rounded text-[10px] font-semibold"
                                >
                                  {item}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex justify-end gap-3 mt-5 pt-3 border-t border-t-gray-100">
                        <button
                          onClick={() => {
                            setEditingPackage(pkg);
                            setPackageFormData({
                              name: pkg.name,
                              description: pkg.description || '',
                              items: pkg.items ? pkg.items.join(', ') : '',
                              price: pkg.price !== undefined ? String(pkg.price) : '',
                            });
                            setPackageFormError('');
                            setIsPackageModalOpen(true);
                          }}
                          className="text-xs font-bold text-brand-600 hover:text-brand-700 transition-colors"
                        >
                          Edit
                        </button>
                        {pkg.name !== 'Tester Pack' && (
                          <button
                            onClick={() => handleDeletePackage(pkg)}
                            className="text-xs font-bold text-red-600 hover:text-red-700 transition-colors"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Enquiry Tickets */}
        {activeTab === 'tickets' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-extrabold text-base text-gray-900">Enquiry Tickets Panel</h2>
              <button
                onClick={openCreateTicketModal}
                className="btn-brand px-6 py-3 rounded-2xl flex items-center justify-center gap-2 text-sm shadow-brand hover:scale-[1.01]"
              >
                + Create Enquiry Ticket
              </button>
            </div>

            {/* Kanban-style Tickets status board */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { id: 'new ticket', title: 'New Ticket', bg: 'bg-[#FFF9F6]' },
                { id: 'waiting on consultation', title: 'Waiting on Consultation', bg: 'bg-[#FFFDF6]' },
                { id: 'completed', title: 'Completed', bg: 'bg-[#F6FDF9]' }
              ].map((column) => {
                const columnTickets = tickets.filter(t => t.status === column.id);
                return (
                  <div key={column.id} className={`${column.bg} border border-border rounded-3xl p-5 flex flex-col min-h-[450px] shadow-sm`}>
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-border">
                      <h3 className="font-display font-extrabold text-sm text-gray-900">{column.title}</h3>
                      <span className="bg-white border border-border text-xs font-bold px-2 py-0.5 rounded-lg">
                        {columnTickets.length}
                      </span>
                    </div>

                    <div className="flex-1 space-y-4 overflow-y-auto max-h-[500px]">
                      {columnTickets.map((ticket) => {
                        const isOverdue = ticket.dueDate && new Date(ticket.dueDate) < new Date() && ticket.status !== 'completed';
                        return (
                          <div key={ticket._id} className="bg-white p-4 rounded-2xl border border-border shadow-sm flex flex-col justify-between gap-3 hover:border-brand-200 transition-colors">
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] text-muted font-bold font-mono">
                                  {ticket.createdDate ? format(new Date(ticket.createdDate), 'MMM d, yyyy') : '—'}
                                </span>
                                {isOverdue && (
                                  <span className="px-1.5 py-0.5 bg-red-50 border border-red-200 text-red-600 text-[8px] font-black rounded uppercase">Overdue</span>
                                )}
                              </div>
                              
                              <div>
                                <h4 className="font-display font-bold text-sm text-gray-900">{ticket.customerDetails?.name}</h4>
                                <p className="text-[10px] text-muted font-mono font-medium">{ticket.customerDetails?.phone} · {ticket.customerDetails?.email || 'No email'}</p>
                              </div>

                              <p className="text-xs text-gray-700 bg-gray-50 border border-gray-100 p-2.5 rounded-xl whitespace-pre-line leading-relaxed">
                                {ticket.enquiry}
                              </p>

                              {ticket.requestedConsultations && (
                                <p className="text-[10px] text-gray-600 font-semibold">
                                  <span className="text-brand-600 font-bold uppercase tracking-wider text-[8px]">Consultations: </span>
                                  {ticket.requestedConsultations}
                                </p>
                              )}

                              {ticket.dueDate && (
                                <p className={`text-[10px] font-bold ${isOverdue ? 'text-red-500' : 'text-gray-500'}`}>
                                  Due: {new Date(ticket.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </p>
                              )}
                            </div>

                            <div className="pt-2 border-t border-border flex justify-between items-center gap-2">
                              <select
                                value={ticket.status}
                                onChange={(e) => handleUpdateTicketStatus(ticket._id, e.target.value)}
                                className="bg-[#FAFAFA] border border-border rounded-xl text-xs px-2 py-1.5 text-gray-800 focus:outline-none"
                              >
                                <option value="new ticket">New Ticket</option>
                                <option value="waiting on consultation">Waiting</option>
                                <option value="completed">Completed</option>
                              </select>

                              <div className="flex gap-2">
                                <button
                                  onClick={() => openEditTicketModal(ticket)}
                                  className="text-xs text-brand-600 font-bold hover:underline"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteTicket(ticket._id)}
                                  className="text-xs text-red-500 font-bold hover:underline"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 5: Sales Reps */}
        {activeTab === 'salesreps' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display font-extrabold text-base text-gray-900">Sales Representatives (Telecallers)</h2>
                <p className="text-xs text-muted mt-0.5">Manage sales personnel and telecallers assigned to track customer onboarding.</p>
              </div>
              <button
                onClick={() => {
                  setEditingSalesRep(null);
                  setSalesRepFormData({ name: '' });
                  setSalesRepFormError('');
                  setIsSalesRepModalOpen(true);
                }}
                className="btn-brand px-6 py-3 rounded-2xl flex items-center justify-center gap-2 text-sm shadow-brand hover:scale-[1.01]"
              >
                + Add Sales Rep
              </button>
            </div>

            {/* Sales Reps Table */}
            <div className="bg-white border border-border rounded-[2.5rem] shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-gradient-to-r from-brand-50/50 to-transparent">
                      <th className="px-6 py-5 text-xs font-bold text-gray-800 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-5 text-xs font-bold text-gray-800 uppercase tracking-wider">Customers Assigned</th>
                      <th className="px-6 py-5 text-xs font-bold text-gray-800 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {salesReps.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-6 py-12 text-center text-sm text-gray-400 font-bold">
                          No sales representatives added yet.
                        </td>
                      </tr>
                    ) : (
                      salesReps.map((rep) => {
                        const assignedCount = customers.filter(c => (c.salesRepId?._id || c.salesRepId) === rep._id).length;
                        return (
                          <tr key={rep._id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center font-display font-extrabold text-xs">
                                  {rep.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}
                                </div>
                                <span className="font-display font-bold text-sm text-gray-900">{rep.name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-brand-50 text-brand-700 border border-brand-100">
                                {assignedCount} customers
                              </span>
                            </td>
                            <td className="px-6 py-5 text-right space-x-3">
                              <button
                                onClick={() => {
                                  setEditingSalesRep(rep);
                                  setSalesRepFormData({ name: rep.name });
                                  setSalesRepFormError('');
                                  setIsSalesRepModalOpen(true);
                                }}
                                className="text-xs text-brand-600 font-bold hover:underline"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteSalesRep(rep)}
                                className="text-xs text-red-500 font-bold hover:underline"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        {/* Tab: Meetings Management */}
        {activeTab === 'meetings' && (
          <MeetingsManager />
        )}

        {/* Tab 7: Recorded Video */}
        {activeTab === 'recorded-video' && (
          <RecordedVideosManager />
        )}

      </main>

      {/* Sales Rep Creation/Edit Modal */}
      {isSalesRepModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => !salesRepFormLoading && setIsSalesRepModalOpen(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
          />

          <div className="bg-white w-full max-w-md rounded-[2.5rem] border border-border shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh] animate-scale-in">
            <div className="px-6 py-5 border-b border-border bg-gradient-to-r from-brand-50/50 to-transparent flex items-center justify-between shrink-0">
              <h3 className="font-display font-extrabold text-base text-gray-900">
                {editingSalesRep ? 'Edit Sales Representative' : 'Add Sales Representative'}
              </h3>
              <button
                onClick={() => !salesRepFormLoading && setIsSalesRepModalOpen(false)}
                className="w-8 h-8 rounded-full border border-border hover:bg-gray-50 flex items-center justify-center text-gray-500 font-bold transition-all text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSalesRep} className="flex flex-col overflow-hidden">
              <div className="p-6 space-y-4 overflow-y-auto">
                {salesRepFormError && (
                  <div className="bg-red-50 text-red-600 text-xs px-4 py-3 rounded-2xl border border-red-100 font-medium">
                    {salesRepFormError}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[10px] tracking-wider text-muted font-bold uppercase">Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter sales representative name"
                    value={salesRepFormData.name}
                    onChange={(e) => setSalesRepFormData({ name: e.target.value })}
                    className="w-full rounded-2xl border border-border bg-[#FAFAFA] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-500 transition-all text-gray-900"
                  />
                </div>
              </div>

              <div className="px-6 py-5 border-t border-border bg-[#FAFAFA] flex justify-end gap-3 shrink-0">
                <button
                  type="button"
                  disabled={salesRepFormLoading}
                  onClick={() => setIsSalesRepModalOpen(false)}
                  className="px-5 py-3 rounded-2xl border border-border text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={salesRepFormLoading}
                  className="btn-brand px-6 py-3 rounded-2xl text-xs font-bold shadow-brand disabled:opacity-50 hover:scale-[1.01]"
                >
                  {salesRepFormLoading ? 'Saving...' : editingSalesRep ? 'Update Representative' : 'Add Representative'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Creation/Edit Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => !formLoading && setIsModalOpen(false)}
            className="absolute inset-0 bg-black/30 backdrop-blur-md transition-opacity"
          />

          <div className="bg-white w-full max-w-lg rounded-[28px] border border-black/[0.08] shadow-[0_24px_60px_rgba(0,0,0,0.18)] relative overflow-hidden flex flex-col max-h-[90vh] animate-scale-in">
            <div className="px-6 py-4 border-b border-black/[0.06] bg-[#F5F5F7]/80 backdrop-blur-xl flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-semibold text-base text-gray-900 tracking-tight">
                  {editingCustomer ? 'Edit Customer' : 'Create New Customer'}
                </h3>
              </div>
              <button
                disabled={formLoading}
                onClick={() => setIsModalOpen(false)}
                className="w-7 h-7 rounded-full bg-black/[0.05] hover:bg-black/[0.08] active:scale-95 flex items-center justify-center text-gray-500 hover:text-gray-900 transition-all text-xs font-semibold"
              >
                ✕
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
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    {editingCustomer ? 'Password (leave blank to keep unchanged)' : 'Password *'}
                  </label>
                  <input
                    type="password"
                    name="password"
                    required={!editingCustomer}
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
                        const currentBatchId = editingCustomer?.batchId?._id || editingCustomer?.batchId || '';
                        const isCurrentBatch = currentBatchId && (currentBatchId === b._id);
                        return (
                          <option key={b._id} value={b._id}>
                            {b.name} (Starts {new Date(b.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}){isStarted ? ' - Started/Active' : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Challenge Start Date</label>
                  <input
                    type="text"
                    disabled
                    value={formData.startDate ? new Date(formData.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Starts manually on user profile'}
                    className="w-full rounded-2xl border border-border bg-[#F3F4F6] px-3 py-3 text-sm text-gray-500 cursor-not-allowed font-semibold"
                  />
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
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 active:scale-95 rounded-full font-medium text-sm text-gray-700 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 bg-[#00A86B] hover:bg-[#00915C] active:scale-95 py-2.5 rounded-full font-medium text-sm text-white shadow-sm transition-all disabled:opacity-50"
                >
                  {formLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Customer Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => !deleteLoading && setDeleteModal({ isOpen: false, targetCustomer: null, isBulk: false })}
            className="absolute inset-0 bg-black/30 backdrop-blur-md transition-opacity"
          />

          <div className="bg-white w-full max-w-md rounded-[28px] border border-black/[0.08] shadow-[0_24px_60px_rgba(0,0,0,0.18)] relative overflow-hidden flex flex-col p-6 animate-scale-in">
            <div className="flex items-center gap-3.5 mb-4">
              <div className="w-11 h-11 rounded-2xl bg-red-50 text-[#FF3B30] flex items-center justify-center shrink-0 border border-red-100">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-base text-gray-900 tracking-tight">
                  {deleteModal.isBulk ? 'Bulk Delete Customers' : 'Delete Customer'}
                </h3>
                <p className="text-xs text-gray-400">This action is permanent and irreversible.</p>
              </div>
            </div>

            <p className="text-[13px] text-gray-600 mb-6 leading-relaxed">
              {deleteModal.isBulk ? (
                <>
                  Are you sure you want to permanently delete{' '}
                  <span className="font-semibold text-gray-900">{selectedCustomerIds.length} selected customer(s)</span>?
                  Their accounts, challenge history, and all logged tasks will be permanently removed.
                </>
              ) : (
                <>
                  Are you sure you want to permanently delete customer{' '}
                  <span className="font-semibold text-gray-900">{deleteModal.targetCustomer?.name}</span>?
                  Their account, challenge history, and all logged tasks will be permanently removed.
                </>
              )}
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={deleteLoading}
                onClick={() => setDeleteModal({ isOpen: false, targetCustomer: null, isBulk: false })}
                className="px-5 py-2.5 rounded-full border border-black/[0.08] text-xs font-medium text-gray-700 hover:bg-gray-50 active:scale-95 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 rounded-full bg-[#FF3B30] hover:bg-[#E0342A] active:scale-95 text-white text-xs font-medium transition-all disabled:opacity-50 shadow-sm flex items-center gap-2"
              >
                {deleteLoading && (
                  <svg className="animate-spin w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                )}
                {deleteLoading
                  ? 'Deleting...'
                  : deleteModal.isBulk
                  ? `Delete (${selectedCustomerIds.length}) Customers`
                  : 'Delete Customer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Batch Modal */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => !batchFormLoading && setIsBatchModalOpen(false)}
            className="absolute inset-0 bg-black/30 backdrop-blur-md transition-opacity"
          />

          <div className="bg-white w-full max-w-md rounded-[28px] border border-black/[0.08] shadow-[0_24px_60px_rgba(0,0,0,0.18)] relative overflow-hidden flex flex-col animate-scale-in">
            <div className="px-6 py-4 border-b border-black/[0.06] bg-[#F5F5F7]/80 backdrop-blur-xl flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-semibold text-base text-gray-900 tracking-tight">
                  {editingBatch ? 'Edit Batch' : 'Create Batch'}
                </h3>
              </div>
              <button
                disabled={batchFormLoading}
                onClick={() => setIsBatchModalOpen(false)}
                className="w-7 h-7 rounded-full bg-black/[0.05] hover:bg-black/[0.08] active:scale-95 flex items-center justify-center text-gray-500 hover:text-gray-900 transition-all text-xs font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveBatch} className="px-6 py-5 space-y-4">
              {batchFormError && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-3 text-xs text-red-700 font-medium">
                  {batchFormError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Batch Name *</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={batchFormData.name}
                  onChange={handleBatchInputChange}
                  placeholder="e.g. Batch of July 2026"
                  className="w-full rounded-xl border border-black/[0.1] bg-[#F5F5F7]/60 focus:bg-white focus:border-[#00A86B] focus:ring-4 focus:ring-[#00A86B]/15 transition-all text-sm text-gray-900 px-3.5 py-2.5 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Challenge Start Date *</label>
                <input
                  type="date"
                  name="startDate"
                  required
                  value={batchFormData.startDate}
                  onChange={handleBatchInputChange}
                  className="w-full rounded-xl border border-black/[0.1] bg-[#F5F5F7]/60 focus:bg-white focus:border-[#00A86B] focus:ring-4 focus:ring-[#00A86B]/15 transition-all text-sm text-gray-900 px-3.5 py-2.5 outline-none"
                />
              </div>

              {/* Timeframe / Duration in Months */}
              <div className="pt-1">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-gray-700">Program Timeframe / Duration *</label>
                  <span className="text-[11px] font-bold text-brand-600 bg-brand-50 border border-brand-100 px-2 py-0.5 rounded-md">
                    {batchFormData.durationMonths} Month{batchFormData.durationMonths > 1 ? 's' : ''}
                  </span>
                </div>

                {/* Quick month pills */}
                <div className="grid grid-cols-4 gap-1.5 mb-2.5">
                  {[1, 2, 3, 6].map((m) => {
                    const isSelected = Number(batchFormData.durationMonths) === m;
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => handleSelectMonths(m)}
                        className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all border ${
                          isSelected
                            ? 'bg-[#00A86B] text-white border-[#00A86B] shadow-sm'
                            : 'bg-[#F5F5F7] hover:bg-gray-200 text-gray-700 border-black/[0.05]'
                        }`}
                      >
                        {m} {m === 1 ? 'Month' : 'Months'}
                      </button>
                    );
                  })}
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                      Months
                    </label>
                    <input
                      type="number"
                      name="durationMonths"
                      min="1"
                      max="36"
                      required
                      value={batchFormData.durationMonths}
                      onChange={handleBatchInputChange}
                      className="w-full rounded-xl border border-black/[0.1] bg-[#F5F5F7]/60 focus:bg-white focus:border-[#00A86B] focus:ring-4 focus:ring-[#00A86B]/15 transition-all text-sm text-gray-900 px-3 py-2 outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                      Program End Date
                    </label>
                    <input
                      type="date"
                      name="endDate"
                      required
                      value={batchFormData.endDate}
                      onChange={handleBatchInputChange}
                      className="w-full rounded-xl border border-black/[0.1] bg-[#F5F5F7]/60 focus:bg-white focus:border-[#00A86B] focus:ring-4 focus:ring-[#00A86B]/15 transition-all text-sm text-gray-900 px-3 py-2 outline-none"
                    />
                  </div>
                </div>

                {/* Timeframe Info Card */}
                {batchFormData.startDate && batchFormData.endDate && (() => {
                  const s = parseLocalDate(batchFormData.startDate);
                  const e = parseLocalDate(batchFormData.endDate);
                  if (!s || !e || isNaN(s.getTime()) || isNaN(e.getTime())) return null;
                  const totalDays = calculateTotalDays(s, e);
                  return (
                    <div className="mt-2.5 p-3 rounded-2xl bg-brand-50/70 border border-brand-200/60 text-xs text-brand-900 space-y-1">
                      <div className="flex items-center justify-between font-bold">
                        <span>🗓 Program Schedule:</span>
                        <span className="font-mono text-brand-700 bg-brand-100/60 px-2 py-0.5 rounded-md">{totalDays} Days Total</span>
                      </div>
                      <p className="text-[11px] text-brand-800 leading-relaxed">
                        Starts on <span className="font-semibold">{format(s, 'MMM d, yyyy')}</span> (Day {s.getDate()}) and ends on next month day {s.getDate()} (<span className="font-semibold">{format(e, 'MMM d, yyyy')}</span>).
                      </p>
                    </div>
                  );
                })()}
              </div>

              <div className="flex gap-2.5 pt-4 shrink-0">
                {editingBatch && (
                  <button
                    type="button"
                    onClick={() => {
                      const batchToDelete = editingBatch;
                      setIsBatchModalOpen(false);
                      openDeleteBatchModal(batchToDelete);
                    }}
                    className="px-4 py-2.5 bg-red-50 hover:bg-red-100 active:scale-95 text-[#FF3B30] rounded-full font-medium text-sm border border-red-200 transition-all"
                  >
                    Delete Batch
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsBatchModalOpen(false)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 active:scale-95 rounded-full font-medium text-sm text-gray-700 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={batchFormLoading}
                  className="flex-1 bg-[#00A86B] hover:bg-[#00915C] active:scale-95 py-2.5 rounded-full font-medium text-sm text-white shadow-sm transition-all disabled:opacity-50"
                >
                  {batchFormLoading ? 'Saving...' : 'Save Batch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Batch Confirmation Modal */}
      {deleteBatchModal.isOpen && deleteBatchModal.batch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={handleCloseDeleteBatchModal}
            className="absolute inset-0 bg-black/30 backdrop-blur-md transition-opacity"
          />

          <div className="bg-white w-full max-w-md rounded-[28px] border border-black/[0.08] shadow-[0_24px_60px_rgba(0,0,0,0.18)] relative overflow-hidden flex flex-col p-6 animate-scale-in">
            {(() => {
              const enrolled = customers.filter(
                (c) => (c.batchId?._id || c.batchId) === deleteBatchModal.batch._id
              ).length;
              const hasCustomers = enrolled > 0;

              return (
                <>
                  <div className="flex items-center gap-3.5 mb-4">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
                        hasCustomers ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-red-50 text-[#FF3B30] border-red-100'
                      }`}
                    >
                      {hasCustomers ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-base text-gray-900 tracking-tight">
                        {hasCustomers ? 'Cannot Delete Batch' : 'Delete Batch'}
                      </h3>
                      <p className="text-xs text-gray-400">
                        {hasCustomers ? 'Batch has active customers' : 'This action is permanent and cannot be undone'}
                      </p>
                    </div>
                  </div>

                  {hasCustomers ? (
                    <div className="space-y-3 mb-6">
                      <p className="text-[13px] text-gray-600 leading-relaxed">
                        Batch <span className="font-semibold text-gray-900">"{deleteBatchModal.batch.name}"</span> currently has{' '}
                        <span className="font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                          {enrolled} enrolled customer(s)
                        </span>.
                      </p>
                      <p className="text-xs text-gray-500 bg-[#F5F5F7] p-3 rounded-2xl border border-black/[0.04]">
                        <strong>Rule:</strong> Only batches without any customer can be deleted. Please reassign or delete the enrolled customers before deleting this batch.
                      </p>
                    </div>
                  ) : (
                    <p className="text-[13px] text-gray-600 mb-6 leading-relaxed">
                      Are you sure you want to permanently delete batch{' '}
                      <span className="font-semibold text-gray-900">"{deleteBatchModal.batch.name}"</span>?
                      This batch currently has <strong className="text-[#34C759]">0 customers enrolled</strong> and can be safely removed.
                    </p>
                  )}

                  <div className="flex items-center justify-end gap-2.5 pt-2">
                    <button
                      type="button"
                      disabled={deleteBatchModal.loading}
                      onClick={handleCloseDeleteBatchModal}
                      className="px-5 py-2.5 rounded-full border border-black/[0.08] text-xs font-medium text-gray-700 hover:bg-gray-50 active:scale-95 transition-all disabled:opacity-50"
                    >
                      {hasCustomers ? 'Close' : 'Cancel'}
                    </button>
                    {!hasCustomers && (
                      <button
                        type="button"
                        disabled={deleteBatchModal.loading}
                        onClick={handleConfirmDeleteBatch}
                        className="px-5 py-2.5 rounded-full bg-[#FF3B30] hover:bg-[#E0342A] active:scale-95 text-white text-xs font-medium transition-all disabled:opacity-50 shadow-sm flex items-center gap-2"
                      >
                        {deleteBatchModal.loading && (
                          <svg className="animate-spin w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                          </svg>
                        )}
                        {deleteBatchModal.loading ? 'Deleting...' : 'Delete Batch'}
                      </button>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Creation/Edit Package Modal */}
      {isPackageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => !packageFormLoading && setIsPackageModalOpen(false)}
            className="absolute inset-0 bg-black/30 backdrop-blur-md transition-opacity"
          />

          <div className="bg-white w-full max-w-md rounded-[28px] border border-black/[0.08] shadow-[0_24px_60px_rgba(0,0,0,0.18)] relative overflow-hidden flex flex-col animate-scale-in">
            <div className="px-6 py-4 border-b border-black/[0.06] bg-[#F5F5F7]/80 backdrop-blur-xl flex items-center justify-between shrink-0">
              <h3 className="font-semibold text-base text-gray-900 tracking-tight">
                {editingPackage ? 'Edit Package' : 'Create New Package'}
              </h3>
              <button
                disabled={packageFormLoading}
                onClick={() => setIsPackageModalOpen(false)}
                className="w-7 h-7 rounded-full bg-black/[0.05] hover:bg-black/[0.08] active:scale-95 flex items-center justify-center text-gray-500 hover:text-gray-900 transition-all text-xs font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePackage} className="px-6 py-5 space-y-4">
              {packageFormError && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-3 text-xs text-red-700 font-bold animate-shake">
                  {packageFormError}
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 px-1">Package Name *</label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={packageFormData.name}
                    onChange={handlePackageInputChange}
                    placeholder="e.g. Starter Pack, Premium Plan"
                    className="w-full rounded-2xl border border-border bg-[#FAFAFA] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-500 transition-all text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 px-1">Description</label>
                  <textarea
                    name="description"
                    value={packageFormData.description}
                    onChange={handlePackageInputChange}
                    placeholder="A brief description of this wellness package..."
                    rows={3}
                    className="w-full rounded-2xl border border-border bg-[#FAFAFA] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-500 transition-all text-gray-900 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 px-1">Package Items (comma-separated)</label>
                  <textarea
                    name="items"
                    value={packageFormData.items}
                    onChange={handlePackageInputChange}
                    placeholder="e.g. Daily yoga & fitness class, Meditation audio, Nutrition counseling"
                    rows={3}
                    className="w-full rounded-2xl border border-border bg-[#FAFAFA] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-500 transition-all text-gray-900 resize-none"
                  />
                  <p className="text-[10px] text-muted px-1 mt-1 font-semibold">Separate multiple items with commas.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 px-1">Package Price (₹)</label>
                  <input
                    type="number"
                    name="price"
                    value={packageFormData.price}
                    onChange={handlePackageInputChange}
                    placeholder="e.g. 1999"
                    min="0"
                    className="w-full rounded-2xl border border-border bg-[#FAFAFA] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-500 transition-all text-gray-900"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-4 shrink-0">
                <button
                  type="button"
                  disabled={packageFormLoading}
                  onClick={() => setIsPackageModalOpen(false)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 active:scale-95 rounded-full font-medium text-sm text-gray-700 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={packageFormLoading}
                  className="flex-1 bg-[#00A86B] hover:bg-[#00915C] active:scale-95 py-2.5 rounded-full font-medium text-sm text-white shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {packageFormLoading ? 'Saving...' : 'Save Package'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Enquiry Ticket Modal */}
      {isTicketModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => !ticketFormLoading && setIsTicketModalOpen(false)}
            className="absolute inset-0 bg-black/30 backdrop-blur-md transition-opacity"
          />

          <div className="bg-white w-full max-w-lg rounded-[28px] border border-black/[0.08] shadow-[0_24px_60px_rgba(0,0,0,0.18)] relative overflow-hidden flex flex-col animate-scale-in">
            <div className="px-6 py-4 border-b border-black/[0.06] bg-[#F5F5F7]/80 backdrop-blur-xl flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-semibold text-base text-gray-900 tracking-tight">
                  {editingTicket ? 'Edit Enquiry Ticket' : 'Create Enquiry Ticket'}
                </h3>
              </div>
              <button
                disabled={ticketFormLoading}
                onClick={() => setIsTicketModalOpen(false)}
                className="w-7 h-7 rounded-full bg-black/[0.05] hover:bg-black/[0.08] active:scale-95 flex items-center justify-center text-gray-500 hover:text-gray-900 transition-all text-xs font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTicket} className="px-6 py-5 space-y-4">
              {ticketFormError && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-3 text-xs text-red-700 font-bold">
                  {ticketFormError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Customer Name *</label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={ticketFormData.name}
                    onChange={handleTicketInputChange}
                    className="w-full rounded-2xl border border-border bg-[#FAFAFA] px-4 py-3 text-sm focus:outline-none text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={ticketFormData.phone}
                    onChange={handleTicketInputChange}
                    placeholder="Linked user phone"
                    className="w-full rounded-2xl border border-border bg-[#FAFAFA] px-4 py-3 text-sm focus:outline-none text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={ticketFormData.email}
                  onChange={handleTicketInputChange}
                  className="w-full rounded-2xl border border-border bg-[#FAFAFA] px-4 py-3 text-sm focus:outline-none text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Enquiry details *</label>
                <textarea
                  name="enquiry"
                  required
                  rows="3"
                  value={ticketFormData.enquiry}
                  onChange={handleTicketInputChange}
                  placeholder="Describe customer issue/questions here..."
                  className="w-full rounded-2xl border border-border bg-[#FAFAFA] px-4 py-3 text-sm focus:outline-none text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Requested consultations</label>
                <input
                  type="text"
                  name="requestedConsultations"
                  value={ticketFormData.requestedConsultations}
                  onChange={handleTicketInputChange}
                  placeholder="e.g. Dietician call, Yoga & fitness trainer session"
                  className="w-full rounded-2xl border border-border bg-[#FAFAFA] px-4 py-3 text-sm focus:outline-none text-gray-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    name="dueDate"
                    value={ticketFormData.dueDate}
                    onChange={handleTicketInputChange}
                    className="w-full rounded-2xl border border-border bg-[#FAFAFA] px-4 py-3 text-sm focus:outline-none text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Ticket Status</label>
                  <select
                    name="status"
                    value={ticketFormData.status}
                    onChange={handleTicketInputChange}
                    className="w-full rounded-2xl border border-border bg-[#FAFAFA] px-3 py-3 text-sm focus:outline-none text-gray-900"
                  >
                    <option value="new ticket">New Ticket</option>
                    <option value="waiting on consultation">Waiting on Consultation</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2.5 pt-4 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsTicketModalOpen(false)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 active:scale-95 rounded-full font-medium text-sm text-gray-700 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={ticketFormLoading}
                  className="flex-1 bg-[#00A86B] hover:bg-[#00915C] active:scale-95 py-2.5 rounded-full font-medium text-sm text-white shadow-sm transition-all disabled:opacity-50"
                >
                  {ticketFormLoading ? 'Saving...' : 'Save Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer 30-Day Progress & Tracker Dashboard Modal */}
      {taskViewerCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setTaskViewerCustomer(null)}
            className="absolute inset-0 bg-black/30 backdrop-blur-md transition-opacity"
          />

          <div className="bg-white w-full max-w-5xl h-[90vh] rounded-[28px] border border-black/[0.08] shadow-[0_24px_60px_rgba(0,0,0,0.18)] relative overflow-hidden flex flex-col animate-scale-in">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-black/[0.06] bg-[#F5F5F7]/80 backdrop-blur-xl flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#00A86B]/10 text-[#00A86B] flex items-center justify-center font-semibold text-xs border border-[#00A86B]/20">
                  {taskViewerCustomer.name?.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-base text-gray-900 tracking-tight">
                    {taskViewerCustomer.name}
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Phone: {taskViewerCustomer.phone} · Start Date: {taskViewerCustomer.startDate ? new Date(taskViewerCustomer.startDate).toLocaleDateString() : '—'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setTaskViewerCustomer(null)}
                className="w-7 h-7 rounded-full bg-black/[0.05] hover:bg-black/[0.08] active:scale-95 flex items-center justify-center text-gray-500 hover:text-gray-900 transition-all text-xs font-semibold"
              >
                ✕
              </button>
            </div>

            {/* Profile Sub-tabs Selection */}
            <div className="flex gap-6 border-b border-black/[0.06] px-6 pt-3 select-none bg-white">
              <button
                onClick={() => setProfileSubTab('overview')}
                className={`pb-2.5 font-medium text-xs border-b-2 transition-all ${
                  profileSubTab === 'overview' ? 'border-[#00A86B] text-[#00A86B]' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Overview & Analytics
              </button>
              <button
                onClick={() => setProfileSubTab('tasks')}
                className={`pb-2.5 font-medium text-xs border-b-2 transition-all ${
                  profileSubTab === 'tasks' ? 'border-[#00A86B] text-[#00A86B]' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Daily Tasks Timeline
              </button>
            </div>

            {/* Modal Body Contents */}
            <div className="flex-1 overflow-y-auto">
              
              {/* SUBTAB 1: Overview & Analytics */}
              {profileSubTab === 'overview' && (
                <div className="p-6 space-y-6">
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
                      {/* Top Header details */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Summary metrics card */}
                        <div className="md:col-span-1 border border-brand-500/10 rounded-3xl p-5 bg-gradient-to-br from-brand-50 to-[#E2F0E7] flex flex-col justify-center gap-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-brand-600 font-extrabold uppercase tracking-widest">Active Day</span>
                            <span className="bg-brand-500/10 border border-brand-500/20 text-brand-700 text-[10px] font-bold px-2 py-0.5 rounded-lg">
                              Day {getCurrentDayNumberLocal(taskViewerCustomer.startDate, stats.totalDays)} / {stats.totalDays}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-3 mt-1">
                            <div className="text-brand-500">
                              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              </svg>
                            </div>
                            <div>
                              <p className="font-display font-extrabold text-xl text-gray-900 leading-none">{stats.streak}</p>
                              <p className="text-[9px] text-gray-500 font-bold uppercase mt-1">Current Streak</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="text-emerald-500">
                              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <div>
                              <p className="font-display font-extrabold text-xl text-gray-900 leading-none">{stats.completedDaysCount}</p>
                              <p className="text-[9px] text-gray-500 font-bold uppercase mt-1">Total Days Completed</p>
                            </div>
                          </div>
                        </div>

                        {/* Customer Health Profile Card */}
                        <div className="md:col-span-2 bg-[#FAFAFA] border border-border rounded-3xl p-5 flex flex-col justify-between">
                          <h4 className="font-display font-extrabold text-sm text-gray-900 border-b border-border pb-2 mb-3">Customer Health Profile</h4>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-semibold text-gray-700">
                            <div>
                              <p className="text-muted text-[10px] uppercase font-bold">Age</p>
                              <p className="text-sm font-display font-black text-gray-900 mt-1">{taskViewerCustomer.age ? `${taskViewerCustomer.age} yrs` : '—'}</p>
                            </div>
                            <div>
                              <p className="text-muted text-[10px] uppercase font-bold">Gender</p>
                              <p className="text-sm font-display font-black text-gray-900 mt-1 capitalize">{taskViewerCustomer.gender || '—'}</p>
                            </div>
                            <div>
                              <p className="text-muted text-[10px] uppercase font-bold">Height & Weight</p>
                              <p className="text-sm font-display font-black text-gray-900 mt-1">{taskViewerCustomer.heightCm ? `${taskViewerCustomer.heightCm} cm` : '—'} / {taskViewerCustomer.weightKg ? `${taskViewerCustomer.weightKg} kg` : '—'}</p>
                            </div>
                            <div>
                              <p className="text-muted text-[10px] uppercase font-bold">BMI Category</p>
                              {calcBMI(taskViewerCustomer.heightCm, taskViewerCustomer.weightKg) ? (
                                <p className="text-sm font-display font-black text-gray-900 mt-1">
                                  {calcBMI(taskViewerCustomer.heightCm, taskViewerCustomer.weightKg).toFixed(1)} ({getBMICategory(calcBMI(taskViewerCustomer.heightCm, taskViewerCustomer.weightKg)).label})
                                </p>
                              ) : <p className="text-sm font-display font-black text-gray-900 mt-1">—</p>}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Stats Overview */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="border border-emerald-500/10 rounded-2xl p-4 bg-white flex flex-col justify-between shadow-sm">
                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Total Yoga Session</p>
                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Total Yoga &amp; Fitness</p>
                          <h3 className="font-display font-black text-xl text-emerald-600 mt-1.5">{stats.totalYoga ? `${stats.totalYoga} min` : '0 min'}</h3>
                        </div>
                        <div className="border border-purple-500/10 rounded-2xl p-4 bg-white flex flex-col justify-between shadow-sm">
                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Total Meditation Session</p>
                          <h3 className="font-display font-black text-xl text-purple-600 mt-1.5">{stats.totalMeditation ? `${stats.totalMeditation} min` : '0 min'}</h3>
                        </div>
                        <div className="border border-cyan-500/10 rounded-2xl p-4 bg-white flex flex-col justify-between shadow-sm">
                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Total Water Hydrated</p>
                          <h3 className="font-display font-black text-xl text-cyan-600 mt-1.5">{stats.totalWater ? `${(stats.totalWater/1000).toFixed(1)} L` : '0 L'}</h3>
                        </div>
                        <div className="border border-indigo-500/10 rounded-2xl p-4 bg-white flex flex-col justify-between shadow-sm">
                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Avg Sleep Duration</p>
                          <h3 className="font-display font-black text-xl text-indigo-600 mt-1.5">{stats.avgSleep ? `${stats.avgSleep} hrs` : '0 hrs'}</h3>
                        </div>
                      </div>

                      {/* Charts Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Yoga Trend */}
                        <div className="border border-border rounded-3xl p-5 bg-white shadow-sm space-y-3">
                          <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-1.5">Yoga & Fitness trend</p>
                          <div className="h-36">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={stats.yogaData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                                <defs>
                                  <linearGradient id="cYoga" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#6b7280' }} />
                                <YAxis tickFormatter={(val) => `${val}m`} axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#6b7280' }} />
                                <Tooltip content={<CustomTooltip unit="min" />} cursor={{ stroke: '#F3F4F6', strokeWidth: 1 }} />
                                <Area connectNulls={true} type="monotone" dataKey="val" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#cYoga)" dot={{ r: 2, stroke: '#10b981', strokeWidth: 1.5, fill: '#ffffff' }} />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* Meditation Trend */}
                        <div className="border border-border rounded-3xl p-5 bg-white shadow-sm space-y-3">
                          <p className="text-xs font-bold text-purple-600 uppercase tracking-widest flex items-center gap-1.5">Meditation trend</p>
                          <div className="h-36">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={stats.meditationData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                                <defs>
                                  <linearGradient id="cMeditation" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#9333ea" stopOpacity={0.15}/>
                                    <stop offset="95%" stopColor="#9333ea" stopOpacity={0}/>
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#6b7280' }} />
                                <YAxis tickFormatter={(val) => `${val}m`} axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#6b7280' }} />
                                <Tooltip content={<CustomTooltip unit="min" />} cursor={{ stroke: '#F3F4F6', strokeWidth: 1 }} />
                                <Area connectNulls={true} type="monotone" dataKey="val" stroke="#9333ea" strokeWidth={2.5} fillOpacity={1} fill="url(#cMeditation)" dot={{ r: 2, stroke: '#9333ea', strokeWidth: 1.5, fill: '#ffffff' }} />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* Water Trend */}
                        <div className="border border-border rounded-3xl p-5 bg-white shadow-sm space-y-3">
                          <p className="text-xs font-bold text-cyan-600 uppercase tracking-widest flex items-center gap-1.5">Water trend</p>
                          <div className="h-36">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={stats.waterData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                                <defs>
                                  <linearGradient id="cWater" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.15}/>
                                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#6b7280' }} />
                                <YAxis tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(0)}L` : `${val}ml`} axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#6b7280' }} />
                                <Tooltip content={<CustomTooltip unit="ml" />} cursor={{ stroke: '#F3F4F6', strokeWidth: 1 }} />
                                <Area connectNulls={true} type="monotone" dataKey="val" stroke="#06b6d4" strokeWidth={2.5} fillOpacity={1} fill="url(#cWater)" dot={{ r: 2, stroke: '#06b6d4', strokeWidth: 1.5, fill: '#ffffff' }} />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        </div>


                        {/* Sleep Trend */}
                        <div className="border border-border rounded-3xl p-5 bg-white shadow-sm space-y-3">
                          <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-1.5">Sleep trend</p>
                          <div className="h-36">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={stats.sleepData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                                <defs>
                                  <linearGradient id="cSleep" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15}/>
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#6b7280' }} />
                                <YAxis tickFormatter={(val) => `${val}h`} axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#6b7280' }} />
                                <Tooltip content={<CustomTooltip unit="hrs" />} cursor={{ stroke: '#F3F4F6', strokeWidth: 1 }} />
                                <Area connectNulls={true} type="monotone" dataKey="val" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#cSleep)" dot={{ r: 2, stroke: '#6366f1', strokeWidth: 1.5, fill: '#ffffff' }} />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* SUBTAB 2: Daily Tasks Timeline (Checklist & Value updates) */}
              {profileSubTab === 'tasks' && (() => {
                const customerDayNum = getCurrentDayNumberLocal(taskViewerCustomer.startDate, stats.totalDays);
                return (
                  <div className="flex-1 flex flex-col md:flex-row overflow-hidden h-[60vh]">
                    {/* Left: Days grid */}
                    <div className="w-full md:w-3/5 p-6 overflow-y-auto border-b md:border-b-0 md:border-r border-border h-full">
                      <p className="text-xs font-black uppercase text-muted tracking-widest mb-4">{stats.totalDays} Days timeline</p>
                      {tasksLoading ? (
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                          {Array.from({ length: stats.totalDays }).map((_, idx) => (
                            <div key={idx} className="h-16 rounded-2xl bg-gray-100 skeleton" />
                          ))}
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                          {Array.from({ length: stats.totalDays }).map((_, idx) => {
                            const dayNum = idx + 1;
                            const dayLogs = customerTasks.filter((l) => l.dayNumber === dayNum);
                            const completedCount = TASK_ORDER.filter((taskId) => {
                              const log = dayLogs.find((l) => l.taskId === taskId);
                              return isTaskCompleted(taskId, log, dayNum, customerDayNum);
                            }).length;
                            
                            const REQUIRED = ['yoga', 'meditation', 'water'];
                            const isComplete = REQUIRED.every(t => {
                              const log = dayLogs.find(l => l.taskId === t);
                              return isTaskCompleted(t, log, dayNum, customerDayNum);
                            });
                            const isPartial = !isComplete && REQUIRED.some(t => {
                              const log = dayLogs.find(l => l.taskId === t);
                              return isTaskCompleted(t, log, dayNum, customerDayNum);
                            });

                            let dayStyle = 'bg-gray-50 text-gray-400 border-gray-200';
                            if (isComplete) dayStyle = 'bg-emerald-50 text-emerald-800 border-emerald-300';
                            else if (isPartial) dayStyle = 'bg-amber-50 text-amber-800 border-amber-300';

                            const isSelected = selectedTaskDay === dayNum;

                            return (
                              <button
                                key={dayNum}
                                onClick={() => setSelectedTaskDay(dayNum)}
                                className={`flex flex-col items-center justify-between p-3 rounded-2xl border-2 transition-all text-center ${dayStyle} ${
                                  isSelected ? 'ring-2 ring-brand-500 scale-95 border-brand-400' : 'hover:scale-[1.02]'
                                }`}
                              >
                                <span className="text-xs font-black">Day {dayNum}</span>
                                <span className="text-[10px] font-bold mt-1.5 opacity-80">{completedCount}/{TASK_ORDER.length} done</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                  {/* Right: Selected day details */}
                  <div className="w-full md:w-2/5 p-6 overflow-y-auto bg-gray-50/50 flex flex-col h-full">
                    <p className="text-xs font-black uppercase text-muted tracking-widest mb-4">Task Details</p>

                    {selectedTaskDay ? (
                      <div className="space-y-5">
                        <div className="bg-white border border-border p-4 rounded-2xl shadow-sm">
                          <h4 className="font-display font-extrabold text-gray-900 text-sm">Day {selectedTaskDay} Details</h4>
                          <p className="text-[10px] text-muted mt-0.5 font-semibold">Updates are saved automatically on blur/checkbox click.</p>
                        </div>

                        <div className="space-y-3">
                          {TASK_ORDER.map((taskId) => {
                            const isRequired = taskId !== 'sleep';
                            const log = customerTasks.find(l => l.dayNumber === selectedTaskDay && l.taskId === taskId) || { completed: false, amount: 0 };
                            const isCompleted = isTaskCompleted(taskId, log, selectedTaskDay, customerDayNum);
                            const isTodayHydration = selectedTaskDay === customerDayNum && (taskId === 'water' || taskId === 'protein');

                            const titles = {
                              yoga: 'Yoga & Fitness (Minutes)',
                              meditation: 'Meditation (Minutes)',
                              water: 'Water (ml)',
                              protein: 'Protein (g)',
                              sleep: 'Sleep (hours)'
                            };

                            const unit = {
                              yoga: 'min',
                              meditation: 'min',
                              water: 'ml',
                              protein: 'g',
                              sleep: 'hrs'
                            }[taskId];

                            return (
                              <div key={taskId} className="bg-white rounded-2xl border border-border p-4 flex flex-col gap-3 shadow-sm hover:border-brand-200 transition-colors">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                                    {titles[taskId]}
                                    {isRequired && (
                                      <span className="px-1.5 py-0.5 bg-red-50 text-red-600 text-[8px] font-black uppercase rounded">Req</span>
                                    )}
                                  </span>
                                  <input
                                    type="checkbox"
                                    checked={isCompleted}
                                    disabled={isTodayHydration}
                                    onChange={(e) => {
                                      const isChecking = e.target.checked;
                                      let newAmount = log.amount;
                                      if (taskId === 'water' && isChecking && log.amount < 2500) {
                                        newAmount = 2500;
                                      } else if (taskId === 'protein' && isChecking && log.amount < 60) {
                                        newAmount = 60;
                                      } else if ((taskId === 'water' || taskId === 'protein') && !isChecking) {
                                        newAmount = 0;
                                      }
                                      handleUpdateTaskLog(selectedTaskDay, taskId, isChecking, newAmount);
                                    }}
                                    className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                  />
                                </div>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    placeholder={`Amount in ${unit}`}
                                    value={log.amount || ''}
                                    onBlur={(e) => {
                                      const newAmt = Number(e.target.value);
                                      let updatedCompleted = log.completed;
                                      if (taskId === 'water') {
                                        updatedCompleted = selectedTaskDay === customerDayNum ? false : newAmt >= 2500;
                                      } else if (taskId === 'protein') {
                                        updatedCompleted = selectedTaskDay === customerDayNum ? false : newAmt >= 60;
                                      } else if (taskId === 'yoga' || taskId === 'meditation' || taskId === 'sleep') {
                                        updatedCompleted = newAmt > 0;
                                      }
                                      handleUpdateTaskLog(selectedTaskDay, taskId, updatedCompleted, newAmt);
                                    }}
                                    onChange={(e) => {
                                      const newVal = Number(e.target.value);
                                      setCustomerTasks((prev) =>
                                        prev.map((l) => (l.dayNumber === selectedTaskDay && l.taskId === taskId) ? { ...l, amount: newVal } : l)
                                      );
                                    }}
                                    className="flex-1 rounded-xl border border-border bg-[#FAFAFA] px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-500 transition-all text-gray-900"
                                  />
                                  <span className="text-xs text-muted font-bold w-8">{unit}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                        <p className="text-sm font-bold text-gray-800">No day selected</p>
                        <p className="text-xs text-gray-400 mt-1 max-w-xs">Click on any day in the timeline grid on the left to edit daily logs.</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            </div>
          </div>
        </div>
      )}

      {/* View Batch Members Modal */}
      {viewingBatchMembers && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-[28px] border border-black/[0.08] p-6 md:p-8 max-w-2xl w-full shadow-[0_24px_60px_rgba(0,0,0,0.18)] space-y-6 max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center shrink-0 border-b border-black/[0.06] pb-4">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#00A86B] bg-[#00A86B]/10 px-2.5 py-0.5 rounded-full">Batch Roster</span>
                <h3 className="font-semibold text-lg text-gray-900 mt-1 tracking-tight">{viewingBatchMembers.name}</h3>
                <p className="text-xs text-gray-400">
                  Starts: {new Date(viewingBatchMembers.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              <button
                onClick={() => setViewingBatchMembers(null)}
                className="w-7 h-7 rounded-full bg-black/[0.05] hover:bg-black/[0.08] active:scale-95 flex items-center justify-center text-gray-500 hover:text-gray-900 transition-all text-xs font-semibold"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {(() => {
                const members = customers.filter(
                  c => (c.batchId?._id || c.batchId) === viewingBatchMembers._id
                );
                if (members.length === 0) {
                  return (
                    <div className="text-center py-12 text-xs text-gray-400">
                      No customers are currently enrolled in this batch.
                    </div>
                  );
                }
                return members.map((member) => (
                  <div key={member._id} className="p-4 rounded-2xl border border-border bg-[#FAFAFA] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-brand-100 text-brand-700 font-bold flex items-center justify-center text-sm shadow-sm">
                        {member.name ? member.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div>
                        <h4 className="font-display font-bold text-sm text-gray-900">{member.name}</h4>
                        <p className="text-xs text-muted">Phone: {member.phone}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-gray-800 block">
                        {member.packageId?.name || 'Standard Package'}
                      </span>
                      <span className="text-[10px] text-muted font-medium">
                        Joined {member.joinedDate ? new Date(member.joinedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Recently'}
                      </span>
                    </div>
                  </div>
                ));
              })()}
            </div>

            <div className="pt-4 border-t border-border flex justify-end shrink-0">
              <button
                onClick={() => setViewingBatchMembers(null)}
                className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-2xl transition-colors"
              >
                Close Roster
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  );
}
