import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useUserStore } from '../store/useUserStore';
import { useApi } from '../hooks/useApi';
import { calcBMI, getBMICategory } from '../utils/bmiCalc';
import { getCurrentDayNumber } from '../utils/dateUtils';
import { format } from 'date-fns';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import { TASK_CONFIG, TASK_ORDER } from '../utils/taskConfig';
import { isTaskCompleted } from '../utils/taskCompletion';
import RecordedVideosManager from '../components/admin/RecordedVideosManager';
import MeetingsManager from '../components/admin/MeetingsManager';

export default function Admin() {
  const { tab: urlTab } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const api = useApi();
  const { logout, user: adminUser } = useUserStore();

  const [customers, setCustomers] = useState([]);
  const [batches, setBatches] = useState([]);
  const [packages, setPackages] = useState([]);
  const [pipelineStages, setPipelineStages] = useState([]);
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
    if (t === 'contacts') return 'customers';
    if (t === 'sales-reps') return 'salesreps';
    if (t === 'stages') return 'pipelines';
    if (t === 'recorded-video' || t === 'recorded-videos' || t === 'videos') return 'recorded-video';
    if (t === 'meetings' || t === 'meeting') return 'meetings';
    return t || 'dashboard';
  };

  const activeTab = normalizeTab(urlTab || location.state?.activeTab);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [selectedBatchFilter, setSelectedBatchFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sendingNotification, setSendingNotification] = useState(false);

  // Customer Form State
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
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
    pipelineId: '',
    currentStageId: '',
  });

  // Batch Form State
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);
  const [viewingBatchMembers, setViewingBatchMembers] = useState(null);
  const [batchFormData, setBatchFormData] = useState({
    name: '',
    startDate: new Date().toISOString().split('T')[0],
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

  // Pipelines and Stages Config State
  const [pipelines, setPipelines] = useState([]);
  const [selectedPipelineId, setSelectedPipelineId] = useState('');
  const [newPipelineName, setNewPipelineName] = useState('');
  const [newStageName, setNewStageName] = useState('');
  const [stageFormLoading, setStageFormLoading] = useState(false);
  const [isPipelineModalOpen, setIsPipelineModalOpen] = useState(false);
  const [editingPipelineId, setEditingPipelineId] = useState(null);
  const [pipelineFormName, setPipelineFormName] = useState('');
  const [pipelineFormLoading, setPipelineFormLoading] = useState(false);
  const [formPipelineStages, setFormPipelineStages] = useState([]);

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

  // Push Notification Config State
  const [pushConfigs, setPushConfigs] = useState([]);
  const [pushConfigsLoading, setPushConfigsLoading] = useState(false);
  const [isPushConfigModalOpen, setIsPushConfigModalOpen] = useState(false);
  const [editingPushConfig, setEditingPushConfig] = useState(null);
  const [pushConfigFormLoading, setPushConfigFormLoading] = useState(false);
  const [pushConfigFormError, setPushConfigFormError] = useState('');
  const [pushConfigFormData, setPushConfigFormData] = useState({
    title: '',
    body: '',
    type: 'fixed',
    fixedTime: '08:00',
    intervalMinutes: 120,
    category: 'water',
    targetUrl: '/tasks',
    isActive: true,
  });

  // Instant Broadcast Push State
  const [instantPushData, setInstantPushData] = useState({
    title: 'Eldro+ Important Alert',
    body: 'Drink water and complete your daily health tasks!',
    category: 'general',
    targetUrl: '/',
  });
  const [instantPushLoading, setInstantPushLoading] = useState(false);
  const [instantPushResult, setInstantPushResult] = useState(null);

  useEffect(() => {
    fetchCustomers();
    fetchBatches();
    fetchPipelines();
    fetchTickets();
    fetchPackages();
    fetchSalesReps();
    fetchPushConfigs();
  }, []);

  useEffect(() => {
    if (selectedPipelineId) {
      fetchPipelineStages(selectedPipelineId);
    } else {
      setPipelineStages([]);
    }
  }, [selectedPipelineId]);

  useEffect(() => {
    if (formData.pipelineId) {
      api.get(`/api/admin/pipeline-stages?pipelineId=${formData.pipelineId}`)
        .then(data => setFormPipelineStages(data.stages || []))
        .catch(err => console.error(err));
    } else {
      setFormPipelineStages([]);
    }
  }, [formData.pipelineId]);

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

  async function fetchPipelines() {
    try {
      const data = await api.get('/api/admin/pipelines');
      const list = data.pipelines || [];
      setPipelines(list);
      if (list.length > 0 && !selectedPipelineId) {
        setSelectedPipelineId(list[0]._id);
      }
    } catch (err) {
      console.error('Failed to fetch pipelines:', err);
    }
  }

  async function fetchPipelineStages(pipelineId = selectedPipelineId) {
    if (!pipelineId) {
      setPipelineStages([]);
      return;
    }
    try {
      const data = await api.get(`/api/admin/pipeline-stages?pipelineId=${pipelineId}`);
      setPipelineStages(data.stages || []);
    } catch (err) {
      console.error('Failed to fetch pipeline stages:', err);
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

  async function fetchPushConfigs() {
    setPushConfigsLoading(true);
    try {
      const data = await api.get('/api/admin/push-config');
      setPushConfigs(data.configs || []);
    } catch (err) {
      console.error('Failed to fetch push configs:', err);
    } finally {
      setPushConfigsLoading(false);
    }
  }

  const openCreatePushConfigModal = () => {
    setEditingPushConfig(null);
    setPushConfigFormData({
      title: '',
      body: '',
      type: 'fixed',
      fixedTime: '08:00',
      intervalMinutes: 120,
      category: 'water',
      targetUrl: '/tasks',
      isActive: true,
    });
    setPushConfigFormError('');
    setIsPushConfigModalOpen(true);
  };

  const openEditPushConfigModal = (cfg) => {
    setEditingPushConfig(cfg);
    setPushConfigFormData({
      title: cfg.title || '',
      body: cfg.body || '',
      type: cfg.type || 'fixed',
      fixedTime: cfg.fixedTime || '08:00',
      intervalMinutes: cfg.intervalMinutes || 120,
      category: cfg.category || 'general',
      targetUrl: cfg.targetUrl || '/',
      isActive: cfg.isActive !== undefined ? cfg.isActive : true,
    });
    setPushConfigFormError('');
    setIsPushConfigModalOpen(true);
  };

  const handleSavePushConfig = async (e) => {
    e.preventDefault();
    setPushConfigFormError('');
    setPushConfigFormLoading(true);

    if (!pushConfigFormData.title.trim() || !pushConfigFormData.body.trim()) {
      setPushConfigFormError('Title and message text area content are required');
      setPushConfigFormLoading(false);
      return;
    }

    try {
      if (editingPushConfig) {
        const res = await api.put('/api/admin/push-config', {
          id: editingPushConfig._id,
          ...pushConfigFormData,
        });
        setPushConfigs((prev) => prev.map((c) => c._id === res.config._id ? res.config : c));
        setSuccessMsg(`Push Notification configuration updated successfully!`);
      } else {
        const res = await api.post('/api/admin/push-config', pushConfigFormData);
        setPushConfigs((prev) => [res.config, ...prev]);
        setSuccessMsg(`New Push Notification configuration created!`);
      }
      setIsPushConfigModalOpen(false);
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      setPushConfigFormError(err.message || 'Failed to save notification config');
    } finally {
      setPushConfigFormLoading(false);
    }
  };

  const handleTogglePushConfigActive = async (cfg) => {
    try {
      const res = await api.put('/api/admin/push-config', {
        id: cfg._id,
        isActive: !cfg.isActive,
      });
      setPushConfigs((prev) => prev.map((c) => c._id === cfg._id ? res.config : c));
    } catch (err) {
      console.error('Failed to toggle config:', err);
    }
  };

  const handleDeletePushConfig = async (cfg) => {
    if (!window.confirm(`Are you sure you want to delete push notification "${cfg.title}"?`)) return;
    try {
      await api.delete(`/api/admin/push-config?id=${cfg._id}`);
      setPushConfigs((prev) => prev.filter((c) => c._id !== cfg._id));
      setSuccessMsg('Push notification configuration deleted.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to delete config');
      setTimeout(() => setError(''), 4000);
    }
  };

  const handleSendInstantBroadcast = async (e) => {
    e.preventDefault();
    if (!instantPushData.title.trim() || !instantPushData.body.trim()) {
      alert('Notification title and message text are required');
      return;
    }

    setInstantPushLoading(true);
    setInstantPushResult(null);

    try {
      const data = await api.post('/api/admin/send-instant-push', instantPushData);
      if (data.success) {
        setInstantPushResult(data);
        setSuccessMsg(`Instant Push Notification sent to ${data.sent} device(s)! (${data.totalSubscribers} total subscribers)`);
        setTimeout(() => setSuccessMsg(''), 6000);
      }
    } catch (err) {
      alert(err.message || 'Failed to send instant broadcast push');
    } finally {
      setInstantPushLoading(false);
    }
  };

  async function handleLogout() {
    logout();
    navigate('/login');
  }

  async function handleSendTestNotification() {
    const msg = window.prompt("Enter test notification message (optional):", "This is a test push notification from the eldroplus Admin Panel.");
    if (msg === null) return;
    
    setSendingNotification(true);
    setError('');
    setSuccessMsg('');
    
    try {
      const data = await api.post('/api/admin/test-notification', { message: msg });
      if (data.success) {
        setSuccessMsg(`Successfully sent push notification to ${data.sent} customer(s). (${data.expired} expired subscription(s) cleaned up)`);
        setTimeout(() => setSuccessMsg(''), 6000);
      }
    } catch (err) {
      setError(err.message || 'Failed to send test notifications');
      setTimeout(() => setError(''), 5000);
    } finally {
      setSendingNotification(false);
    }
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
      pipelineId: '',
      currentStageId: '',
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
      pipelineId: customer.pipelineId?._id || customer.pipelineId || '',
      currentStageId: customer.currentStageId?._id || customer.currentStageId || '',
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
        pipelineId: formData.pipelineId || null,
        currentStageId: formData.currentStageId || null,
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
          pipelineId: '',
          currentStageId: '',
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

  const handleDeleteCustomer = async (customer) => {
    if (!window.confirm(`Are you sure you want to delete customer "${customer.name}"? This will permanently delete their account and all task logs.`)) {
      return;
    }
    try {
      await api.delete(`/api/admin/customers?id=${customer._id}`);
      setCustomers((prev) => prev.filter((c) => c._id !== customer._id));
      setSuccessMsg(`Customer "${customer.name}" deleted successfully.`);
      setTimeout(() => setSuccessMsg(''), 5000);
      fetchBatches();
    } catch (err) {
      setError(err.message || 'Failed to delete customer');
      setTimeout(() => setError(''), 5000);
    }
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
    setBatchFormData((prev) => ({ ...prev, [name]: value }));
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
      if (editingBatch) {
        const res = await api.put('/api/admin/batches', {
          id: editingBatch._id,
          name: batchFormData.name,
          startDate: batchFormData.startDate,
        });
        setBatches((prev) => prev.map((b) => b._id === res.batch._id ? res.batch : b));
        setSuccessMsg(`Batch "${res.batch.name}" updated successfully!`);
        fetchCustomers();
      } else {
        const res = await api.post('/api/admin/batches', batchFormData);
        setBatches((prev) => [res.batch, ...prev]);
        setSuccessMsg(`Batch "${res.batch.name}" created successfully!`);
      }
      setIsBatchModalOpen(false);
      setBatchFormData({
        name: '',
        startDate: new Date().toISOString().split('T')[0],
      });
      setEditingBatch(null);
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      setBatchFormError(err.message || 'Failed to save batch');
    } finally {
      setBatchFormLoading(false);
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
  // Pipeline Config Handlers
  const handleCreatePipeline = async (e) => {
    e.preventDefault();
    if (!newPipelineName.trim()) return;
    setPipelineFormLoading(true);
    try {
      const data = await api.post('/api/admin/pipelines', { name: newPipelineName });
      setPipelines((prev) => [...prev, data.pipeline]);
      setSelectedPipelineId(data.pipeline._id);
      setNewPipelineName('');
      setSuccessMsg('Pipeline created successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to create pipeline');
    } finally {
      setPipelineFormLoading(false);
    }
  };

  const handleDeletePipeline = async (id) => {
    if (!window.confirm('Are you sure you want to delete this pipeline? All stages and customer links for this pipeline will be lost.')) return;
    try {
      await api.delete(`/api/admin/pipelines?id=${id}`);
      setSuccessMsg('Pipeline deleted successfully.');
      setTimeout(() => setSuccessMsg(''), 4000);
      
      const updatedPipelines = pipelines.filter((p) => p._id !== id);
      setPipelines(updatedPipelines);
      if (selectedPipelineId === id) {
        setSelectedPipelineId(updatedPipelines.length > 0 ? updatedPipelines[0]._id : '');
      }
      fetchCustomers();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to delete pipeline');
    }
  };

  const handleUpdatePipelineName = async (id, newName) => {
    if (!newName.trim()) return;
    try {
      const data = await api.put('/api/admin/pipelines', { id, name: newName });
      setPipelines((prev) => prev.map((p) => p._id === id ? data.pipeline : p));
      setSuccessMsg('Pipeline renamed successfully.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to rename pipeline');
    }
  };

  // Stage Config Handlers
  const handleCreateStage = async (e) => {
    e.preventDefault();
    if (!newStageName.trim() || !selectedPipelineId) return;
    setStageFormLoading(true);
    try {
      const data = await api.post('/api/admin/pipeline-stages', { 
        name: newStageName, 
        pipelineId: selectedPipelineId 
      });
      setPipelineStages((prev) => [...prev, data.stage]);
      setNewStageName('');
      setSuccessMsg('Pipeline stage created successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to create stage');
    } finally {
      setStageFormLoading(false);
    }
  };

  const handleDeleteStage = async (id) => {
    if (!window.confirm('Are you sure you want to delete this pipeline stage? This will reorder the remaining stages.')) return;
    try {
      await api.delete(`/api/admin/pipeline-stages?id=${id}`);
      fetchPipelineStages(selectedPipelineId);
      fetchCustomers();
      setSuccessMsg('Pipeline stage deleted successfully.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to delete stage');
    }
  };

  const handleMoveCustomerStage = async (customerId, newStageId) => {
    try {
      const newStage = pipelineStages.find((ps) => ps._id === newStageId);
      const stagePipelineId = newStage ? newStage.pipelineId : selectedPipelineId;

      await api.put('/api/admin/customers', { 
        id: customerId, 
        pipelineId: newStageId ? stagePipelineId : null,
        currentStageId: newStageId || null 
      });

      setCustomers((prev) =>
        prev.map((c) => {
          if (c._id === customerId) {
            let updatedStages = [...(c.pipelineStages || [])];
            if (newStageId) {
              const targetIndex = pipelineStages.findIndex((ps) => ps._id === newStageId);
              if (targetIndex !== -1) {
                updatedStages = pipelineStages.map((ps, idx) => {
                  const existing = (c.pipelineStages || []).find((eps) => eps.stageId === ps._id);
                  return {
                    stageId: ps._id,
                    name: ps.name,
                    completed: idx < targetIndex,
                    completedAt: idx < targetIndex ? (existing?.completedAt || new Date()) : null,
                  };
                });
              }
            } else {
              updatedStages = [];
            }
            return {
              ...c,
              pipelineId: newStageId ? stagePipelineId : null,
              currentStageId: newStageId || null,
              pipelineStages: updatedStages,
            };
          }
          return c;
        })
      );
      setSuccessMsg('Customer stage updated successfully.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to update stage');
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

  const getCurrentDayNumberLocal = (startDate) => getCurrentDayNumber(startDate);

  // Stats Calculations for selected profile
  const stats = getCustomerStats(customerTasks, taskViewerCustomer);

  // Global calculations
  const totalCount = customers.length;
  const ageCustomers = customers.filter((c) => typeof c.age === 'number' && c.age > 0);
  const avgAge = ageCustomers.length
    ? Math.round(ageCustomers.reduce((acc, c) => acc + c.age, 0) / ageCustomers.length)
    : 0;

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
      totalWater: 0,
      totalYoga: 0,
      avgSleep: 0,
      totalProtein: 0,
      waterData: [],
      sleepData: [],
      proteinData: [],
      yogaData: []
    };

    const customerDayNum = getCurrentDayNumberLocal(user.startDate);
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
    for (let d = 1; d <= 30; d++) {
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
      {/* Sidebar for Desktop & drawer for Mobile */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-border flex flex-col justify-between transition-transform duration-300 transform md:translate-x-0 md:static md:h-screen shrink-0 ${
        isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Sidebar Header / Logo */}
        <div className="p-6 border-b border-border flex items-center gap-3">
          <img src="/eldropluslogomain.png" alt="eldroplus" className="w-9 h-9 object-contain rounded-lg" />
          <div>
            <h1 className="font-display font-extrabold text-base text-gray-900 leading-none">
              eldroplus CRM
            </h1>
            <span className="text-[9px] tracking-wider text-muted font-bold uppercase mt-1 block">Control Panel</span>
          </div>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
              </svg>
            )},
            { id: 'customers', label: 'Customers Directory', icon: (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            )},
            { id: 'onboarding', label: 'Customer Onboarding', icon: (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            )},
            { id: 'batches', label: 'Batches Management', icon: (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            )},
            { id: 'meetings', label: 'Meetings', icon: (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )},
            { id: 'packages', label: 'Packages Management', icon: (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            )},
            { id: 'salesreps', label: 'Sales Reps (Telecallers)', icon: (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            )},
            { id: 'pipelines', label: 'Pipelines', icon: (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2m0 0V2" />
              </svg>
            )},
            { id: 'tickets', label: 'Enquiry Tickets', icon: (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            )},
            { id: 'recorded-video', label: 'Recorded Video', icon: (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )},
            { id: 'push-notifications', label: 'Push Notifications', icon: (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            )}
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                navigate(`/admin/${item.id}`);
                setIsMobileSidebarOpen(false);
              }}
              className={`w-full px-4 py-3 rounded-xl font-display font-extrabold text-xs flex items-center gap-3 transition-all ${
                activeTab === item.id
                  ? 'bg-brand-50 text-brand-700 shadow-sm border border-brand-100/50'
                  : 'text-gray-600 hover:bg-gray-50 border border-transparent'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        {/* Sidebar Footer / User Info */}
        <div className="p-4 border-t border-border bg-gray-50/50 shrink-0">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="min-w-0">
              <p className="text-xs font-bold text-gray-800 truncate">{adminUser?.name || 'Administrator'}</p>
              <p className="text-[10px] text-muted truncate">Admin Role</p>
            </div>
            <button
              onClick={handleSendTestNotification}
              disabled={sendingNotification}
              title="Test Notification"
              className="p-2 text-brand-700 hover:text-brand-800 bg-white border border-brand-200 rounded-xl disabled:opacity-50 transition-colors shadow-sm"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
          </div>
          <button
            onClick={handleLogout}
            className="w-full py-2.5 text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100/80 rounded-xl border border-red-200 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Backdrop for Mobile Sidebar Drawer */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm md:hidden animate-fade-in"
        />
      )}

      {/* Main Right Content Section */}
      <div className="flex-1 flex flex-col md:h-screen md:overflow-y-auto">
        {/* Sticky Mobile Top Header */}
        <header className="sticky top-0 z-20 bg-white border-b border-border px-4 py-3 flex items-center justify-between md:px-8 shadow-sm shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="p-2 text-gray-500 hover:text-gray-700 md:hidden hover:bg-gray-50 rounded-xl border border-border"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h2 className="font-display font-extrabold text-sm md:text-base text-gray-900 capitalize">
              {activeTab === 'onboarding' ? 'Customer Onboarding' : activeTab === 'batches' ? 'Batches Management' : activeTab === 'meetings' ? 'Live Meetings Management' : activeTab === 'pipelines' ? 'Pipelines' : activeTab === 'tickets' ? 'Enquiry Tickets' : activeTab === 'packages' ? 'Packages Management' : activeTab === 'salesreps' ? 'Sales Reps (Telecallers)' : activeTab === 'recorded-video' ? 'Recorded Video' : activeTab === 'push-notifications' ? 'Push Notifications Setup' : activeTab === 'customers' ? 'Customers Directory' : activeTab}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-xs font-semibold text-gray-500">
              Welcome, <span className="text-gray-800 font-bold">{adminUser?.name || 'Administrator'}</span>
            </span>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          {/* Alerts Banner */}
          {successMsg && (
            <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl p-4 mb-6 text-sm text-green-700 animate-scale-in">
              <svg className="w-5 h-5 shrink-0 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-semibold">{successMsg}</span>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 text-sm text-red-700 animate-scale-in">
              <svg className="w-5 h-5 shrink-0 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-semibold">{error}</span>
            </div>
          )}

          {/* Tab Views */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-scale-in">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {/* Card 1: Total Customers */}
                <div className="bg-white rounded-3xl p-6 border border-border shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-500 font-extrabold uppercase tracking-wide">Total Customers</span>
                    <span className="p-2 bg-brand-50 text-brand-600 rounded-xl">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </span>
                  </div>
                  <div className="mt-4">
                    <h3 className="font-display font-black text-3xl text-gray-900">{totalCount}</h3>
                    <div className="flex items-center gap-2 mt-2 text-[10px] text-gray-500 font-bold">
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                        {customers.filter(c => c.gender === 'male').length} Male
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-pink-500"></span>
                        {customers.filter(c => c.gender === 'female').length} Female
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card 2: Average Age */}
                <div className="bg-white rounded-3xl p-6 border border-border shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-500 font-extrabold uppercase tracking-wide">Average Age</span>
                    <span className="p-2 bg-green-50 text-green-600 rounded-xl">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </span>
                  </div>
                  <div className="mt-4">
                    <h3 className="font-display font-black text-3xl text-gray-900">{avgAge} <span className="text-sm text-muted font-bold">years</span></h3>
                    <p className="text-[10px] text-muted font-bold mt-2">Calculated from customer profiles</p>
                  </div>
                </div>

                {/* Card 3: Active Batches */}
                <div className="bg-white rounded-3xl p-6 border border-border shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-500 font-extrabold uppercase tracking-wide">Active Batches</span>
                    <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </span>
                  </div>
                  <div className="mt-4">
                    <h3 className="font-display font-black text-3xl text-gray-900">{batches.length}</h3>
                    <p className="text-[10px] text-muted font-bold mt-2">Group programs scheduled</p>
                  </div>
                </div>

                {/* Card 4: Active Tickets */}
                <div className="bg-white rounded-3xl p-6 border border-border shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-500 font-extrabold uppercase tracking-wide">Enquiry Tickets</span>
                    <span className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                      </svg>
                    </span>
                  </div>
                  <div className="mt-4">
                    <h3 className="font-display font-black text-3xl text-gray-900">
                      {tickets.filter(t => t.status !== 'completed').length}
                    </h3>
                    <p className="text-[10px] text-muted font-bold mt-2">Pending customer inquiries</p>
                  </div>
                </div>
              </div>

              {/* Charts & Analytics Lists Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Column 1: Onboarding Pipeline Distribution */}
                <div className="bg-white rounded-3xl border border-border p-6 shadow-sm">
                  <h3 className="font-display font-extrabold text-base text-gray-900 mb-2">Onboarding Pipeline</h3>
                  <p className="text-xs text-muted mb-6">Customer distribution across pipeline stages.</p>
                  
                  <div className="space-y-4">
                    {pipelineStages.map((stage) => {
                      const count = customers.filter(c => c.currentStageId === stage._id).length;
                      const percentage = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
                      return (
                        <div key={stage._id} className="space-y-1">
                          <div className="flex justify-between text-xs font-bold text-gray-700">
                            <span>{stage.name}</span>
                            <span>{count} ({percentage}%)</span>
                          </div>
                          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-brand-500 rounded-full transition-all" style={{ width: `${percentage}%` }}></div>
                          </div>
                        </div>
                      );
                    })}
                    {/* Unassigned / No Stage */}
                    {(() => {
                      const unassignedCount = customers.filter(c => !c.currentStageId).length;
                      const percentage = totalCount > 0 ? Math.round((unassignedCount / totalCount) * 100) : 0;
                      return (
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs font-bold text-gray-700">
                            <span>No Stage Assigned</span>
                            <span>{unassignedCount} ({percentage}%)</span>
                          </div>
                          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-gray-300 rounded-full transition-all" style={{ width: `${percentage}%` }}></div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Column 2: Wellness Package Popularity */}
                <div className="bg-white rounded-3xl border border-border p-6 shadow-sm">
                  <h3 className="font-display font-extrabold text-base text-gray-900 mb-2">Package Distribution</h3>
                  <p className="text-xs text-muted mb-6">Popularity of wellness packages based on active users.</p>

                  <div className="space-y-4">
                    {packages.map((pkg) => {
                      const count = customers.filter(c => {
                        const cPkgId = c.packageId?._id || c.packageId;
                        return cPkgId === pkg._id;
                      }).length;
                      const percentage = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
                      return (
                        <div key={pkg._id} className="space-y-1">
                          <div className="flex justify-between text-xs font-bold text-gray-700">
                            <div>
                              <span>{pkg.name}</span>
                              <span className="text-[10px] text-brand-500 font-mono font-bold ml-2">₹{pkg.price || 0}</span>
                            </div>
                            <span>{count} ({percentage}%)</span>
                          </div>
                          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-brand-600 rounded-full transition-all" style={{ width: `${percentage}%` }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Column 3: Batch Occupancy */}
                <div className="bg-white rounded-3xl border border-border p-6 shadow-sm lg:col-span-2">
                  <h3 className="font-display font-extrabold text-base text-gray-900 mb-2">Batch Capacity Overview</h3>
                  <p className="text-xs text-muted mb-6">Registered customers per batch.</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {batches.map((batch) => {
                      const count = customers.filter(c => {
                        const cBatchId = c.batchId?._id || c.batchId;
                        return cBatchId === batch._id;
                      }).length;
                      return (
                        <div key={batch._id} className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                          <div>
                            <p className="text-xs font-extrabold text-gray-800">{batch.name}</p>
                            <p className="text-[10px] text-muted font-bold mt-0.5">Starts: {format(new Date(batch.startDate), 'MMM dd, yyyy')}</p>
                          </div>
                          <span className="px-3 py-1 bg-white text-gray-700 border border-gray-200 rounded-xl text-xs font-black shadow-sm">
                            {count} customer(s)
                          </span>
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
                        <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                          <div>
                            <p className="text-xs font-extrabold text-gray-800">Tester Pack / No Batch</p>
                            <p className="text-[10px] text-muted font-bold mt-0.5">Individual Start Mode</p>
                          </div>
                          <span className="px-3 py-1 bg-white text-gray-700 border border-gray-200 rounded-xl text-xs font-black shadow-sm">
                            {testerCount} customer(s)
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'customers' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-3 flex-1 max-w-2xl">
                <div className="relative flex-1">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    placeholder="Search by name or phone number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-500 transition-all text-gray-900"
                  />
                </div>
                <select
                  value={selectedBatchFilter}
                  onChange={(e) => setSelectedBatchFilter(e.target.value)}
                  className="rounded-2xl border border-border bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-500 transition-all text-gray-900"
                >
                  <option value="">All Batches</option>
                  {batches.map((b) => (
                    <option key={b._id} value={b._id}>{b.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-border shadow-sm overflow-hidden">
              <div className="p-6 border-b border-border flex items-center justify-between">
                <h2 className="font-display font-extrabold text-base text-gray-900">Directory</h2>
                <span className="px-2.5 py-1 bg-brand-50 text-brand-700 text-xs font-bold rounded-lg border border-brand-100">
                  {filteredCustomers.length} match(es)
                </span>
              </div>

              {loading ? (
                <div className="p-6 space-y-4">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="flex items-center gap-4 py-2">
                      <div className="w-12 h-12 rounded-2xl skeleton shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-1/4 skeleton" />
                        <div className="h-3 w-1/3 skeleton" />
                      </div>
                      <div className="h-8 w-20 skeleton shrink-0" />
                    </div>
                  ))}
                </div>
              ) : filteredCustomers.length === 0 ? (
                <div className="p-12 text-center">
                  <h3 className="font-display font-bold text-gray-900 mb-1">No customers found</h3>
                  <p className="text-sm text-gray-500">Adjust filters above.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="bg-gradient-to-r from-brand-50/40 to-transparent border-b border-border">
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Phone</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Package</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Batch</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Telecaller</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Created Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredCustomers.map((customer) => {
                        const initials = customer.name
                          ?.split(' ')
                          .filter(Boolean)
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase() || '?';

                        return (
                          <tr key={customer._id} className="hover:bg-brand-50/10 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => navigate(`/admin/customer/${customer._id}`)}
                                  className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-100 to-brand-200 text-brand-700 flex items-center justify-center font-display font-extrabold text-xs border border-brand-200/50 shadow-inner-sm shrink-0"
                                >
                                  {initials}
                                </button>
                                <button
                                  onClick={() => navigate(`/admin/customer/${customer._id}`)}
                                  className="font-display font-bold text-gray-900 text-sm hover:text-brand-500 text-left transition-colors"
                                >
                                  {customer.name}
                                </button>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-xs text-muted font-mono font-semibold">
                              {customer.phone}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {customer.packageId?.name ? (
                                <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-lg border border-amber-200/50 uppercase tracking-wide">
                                  📦 {customer.packageId.name}
                                </span>
                              ) : (
                                <span className="text-gray-400 text-xs font-medium italic">None</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {customer.batchId?.name ? (
                                <span className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-bold rounded-lg border border-border">
                                  {customer.batchId.name}
                                </span>
                              ) : (
                                <span className="text-gray-400 text-xs font-medium italic">No Batch</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {customer.salesRepId?.name ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-brand-50/50 text-brand-700 text-xs font-bold rounded-lg border border-brand-100/50">
                                  👤 {customer.salesRepId.name}
                                </span>
                              ) : (
                                <span className="text-gray-400 text-xs font-medium italic">—</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600 font-medium">
                              {customer.joinedDate || customer.createdAt ? new Date(customer.joinedDate || customer.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
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
                <p className="text-xs text-muted mt-1 max-w-xl">Register customer profiles, assign them to active wellness challenge batches, allocate sales reps/telecallers, and map CRM pipeline stages.</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-3.5 py-2 bg-white border border-border rounded-2xl text-xs font-bold text-gray-700 shadow-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Active Pipelines: {pipelines.length}
                </span>
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
                <p className="text-xs text-muted mt-1">Manage challenge start dates and track enrolled members across active and upcoming batches.</p>
              </div>
              <button
                onClick={() => {
                  setEditingBatch(null);
                  setBatchFormData({ name: '', startDate: new Date().toISOString().split('T')[0] });
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
                  {batches.filter(b => new Date(b.startDate) <= new Date()).length}
                </p>
              </div>
              <div className="bg-white p-5 rounded-3xl border border-border shadow-sm">
                <span className="text-xs font-bold text-muted">Upcoming Batches</span>
                <p className="text-2xl font-display font-black text-amber-600 mt-1">
                  {batches.filter(b => new Date(b.startDate) > new Date()).length}
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
                  const isStarted = new Date(batch.startDate) <= new Date();
                  const enrolledCount = customers.filter(c => c.batchId?._id === batch._id || c.batchId === batch._id).length;
                  return (
                    <div key={batch._id} className="bg-white rounded-3xl border border-border p-6 shadow-sm hover:border-brand-300 transition-all flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="font-display font-black text-base text-gray-900">{batch.name}</h4>
                          <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
                            isStarted ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {isStarted ? 'Active / Started' : 'Upcoming'}
                          </span>
                        </div>
                        <p className="text-xs text-muted">
                          Start Date: <span className="font-bold text-gray-800">{new Date(batch.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </p>
                        <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                          <span className="text-xs font-bold text-gray-700">Enrolled Customers</span>
                          <span className="px-2.5 py-1 bg-brand-50 text-brand-700 text-xs font-black rounded-lg border border-brand-100">
                            {enrolledCount} Members
                          </span>
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
                            setBatchFormData({ name: batch.name, startDate: new Date(batch.startDate).toISOString().split('T')[0] });
                            setIsBatchModalOpen(true);
                          }}
                          className="px-4 py-2 text-xs font-bold text-brand-600 hover:text-brand-700 bg-white border border-brand-200 hover:bg-brand-50 rounded-xl transition-colors"
                        >
                          Edit
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

        {/* Tab 3: Pipelines (Kanban Board) */}
        {activeTab === 'pipelines' && (
          <div className="space-y-8 animate-scale-in">
            
            {/* Pipelines & Stages Configuration Panel */}
            <div className="bg-white rounded-3xl border border-border p-6 shadow-sm space-y-6">
              <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
                <div>
                  <h3 className="font-display font-extrabold text-base text-gray-900">Pipelines & Onboarding Kanban</h3>
                  <p className="text-xs text-muted mt-0.5">Select a pipeline to view onboarding stages, drag/move customers across stages, or manage pipelines.</p>
                </div>
                
                {/* Create Pipeline form */}
                <form onSubmit={handleCreatePipeline} className="flex gap-2 items-center w-full lg:max-w-sm shrink-0">
                  <input
                    type="text"
                    placeholder="New Pipeline Name (e.g. Sales)..."
                    value={newPipelineName}
                    onChange={(e) => setNewPipelineName(e.target.value)}
                    required
                    className="flex-1 rounded-xl border border-border bg-[#FAFAFA] px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-500 transition-all text-gray-900"
                  />
                  <button
                    type="submit"
                    disabled={pipelineFormLoading}
                    className="px-4 py-2 bg-brand-500 text-white rounded-xl text-xs font-bold shadow-sm hover:bg-brand-600 transition-colors whitespace-nowrap"
                  >
                    Create Pipeline
                  </button>
                </form>
              </div>

              {/* Active Pipeline selection and actions */}
              <div className="border-t border-gray-100 pt-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Active Pipeline:</span>
                  <select
                    value={selectedPipelineId}
                    onChange={(e) => setSelectedPipelineId(e.target.value)}
                    className="bg-[#FAFAFA] border border-border rounded-xl text-xs font-extrabold px-3 py-2 text-gray-800 focus:outline-none max-w-xs"
                  >
                    <option value="">-- Select a Pipeline --</option>
                    {pipelines.map((p) => (
                      <option key={p._id} value={p._id}>{p.name}</option>
                    ))}
                  </select>
                  
                  {selectedPipelineId && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const cur = pipelines.find(p => p._id === selectedPipelineId);
                          if (cur) {
                            const newName = prompt('Rename Pipeline:', cur.name);
                            if (newName) handleUpdatePipelineName(selectedPipelineId, newName);
                          }
                        }}
                        className="p-2 bg-gray-50 border border-gray-200 text-gray-700 hover:text-brand-500 rounded-xl text-xs transition-colors"
                        title="Rename Pipeline"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeletePipeline(selectedPipelineId)}
                        className="p-2 bg-red-50 border border-red-100 text-red-600 hover:text-red-700 rounded-xl text-xs transition-colors"
                        title="Delete Pipeline"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>

                {selectedPipelineId && (
                  <form onSubmit={handleCreateStage} className="flex gap-2 items-center w-full md:max-w-xs shrink-0">
                    <input
                      type="text"
                      placeholder="Add stage to active pipeline..."
                      value={newStageName}
                      onChange={(e) => setNewStageName(e.target.value)}
                      required
                      className="flex-1 rounded-xl border border-border bg-[#FAFAFA] px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-500 transition-all text-gray-900"
                    />
                    <button
                      type="submit"
                      disabled={stageFormLoading}
                      className="px-4 py-2 bg-brand-500 text-white rounded-xl text-xs font-bold shadow-sm hover:bg-brand-600 transition-colors whitespace-nowrap"
                    >
                      Add Stage
                    </button>
                  </form>
                )}
              </div>

              {/* Display list of current stages */}
              {selectedPipelineId && pipelineStages.length > 0 && (
                <div className="flex flex-wrap gap-2 items-center border-t border-gray-100 pt-4">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mr-2">Pipeline Stages Order:</span>
                  {pipelineStages.map((stage, idx) => (
                    <span
                      key={stage._id}
                      className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 text-gray-700 text-[11px] font-bold rounded-xl flex items-center gap-1.5"
                    >
                      <span className="text-[10px] text-muted font-mono">{idx + 1}.</span>
                      {stage.name}
                      <button
                        onClick={() => handleDeleteStage(stage._id)}
                        className="text-red-500 hover:text-red-700 text-xs font-bold leading-none pl-1"
                        title="Delete Stage"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Kanban Columns view */}
            {!selectedPipelineId ? (
              <div className="text-center py-12 bg-white rounded-3xl border border-border">
                <p className="text-sm text-gray-500 font-medium">Please select or create a pipeline to view onboarding stages & Kanban.</p>
              </div>
            ) : (
              <div className="overflow-x-auto pb-6">
                <div className="flex gap-4 min-w-full">
                  
                  {/* Customers Column (shows all customers in the system) */}
                  <div className="w-80 shrink-0 bg-gray-100/50 border border-dashed border-gray-200 rounded-3xl p-4 flex flex-col min-h-[450px]">
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200">
                      <h3 className="font-display font-extrabold text-sm text-gray-800">Customers</h3>
                      <span className="bg-gray-200 text-gray-700 text-xs font-bold px-2 py-0.5 rounded-lg">
                        {customers.length}
                      </span>
                    </div>
                    
                    <div className="flex-1 space-y-3 overflow-y-auto max-h-[500px]">
                      {customers.map((c) => (
                        <div key={c._id} className="bg-white p-4 rounded-2xl border border-border shadow-sm flex flex-col justify-between gap-3 hover:border-brand-200 transition-colors">
                          <div>
                            <button
                              onClick={() => navigate(`/admin/customer/${c._id}`)}
                              className="font-display font-bold text-sm text-gray-900 hover:text-brand-500 text-left transition-colors"
                            >
                              {c.name}
                            </button>
                            <p className="text-[10px] text-muted font-mono mt-0.5">{c.phone}</p>
                            <p className="text-[10px] font-semibold text-gray-500 mt-2 uppercase tracking-wide">
                              Progress: {c.pipelineStages?.filter(ps => ps.completed).length || 0} / {pipelineStages.length}
                            </p>
                          </div>
                          <div>
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Move to Stage</label>
                            <select
                              onChange={(e) => handleMoveCustomerStage(c._id, e.target.value)}
                              value={pipelineStages.some(ps => ps._id === c.currentStageId) ? c.currentStageId : ""}
                              className="w-full bg-[#FAFAFA] border border-border rounded-xl text-xs px-2 py-1.5 text-gray-800 focus:outline-none"
                            >
                              <option value="">None / Unassigned</option>
                              {pipelineStages.map((ps) => (
                                <option key={ps._id} value={ps._id}>{ps.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pipeline columns */}
                  {pipelineStages.map((stage) => {
                    const stageCustomers = customers.filter(c => c.currentStageId === stage._id);
                    return (
                      <div key={stage._id} className="w-80 shrink-0 bg-white border border-border rounded-3xl p-4 flex flex-col min-h-[450px] shadow-sm">
                        <div className="flex items-center justify-between mb-4 pb-2 border-b border-border">
                          <h3 className="font-display font-extrabold text-sm text-gray-900">{stage.name}</h3>
                          <span className="bg-brand-50 text-brand-700 text-xs font-bold px-2 py-0.5 rounded-lg border border-brand-100">
                            {stageCustomers.length}
                          </span>
                        </div>

                        <div className="flex-1 space-y-3 overflow-y-auto max-h-[500px]">
                          {stageCustomers.map((c) => {
                            const completedCount = c.pipelineStages?.filter(ps => ps.completed).length || 0;
                            return (
                              <div key={c._id} className="bg-surface p-4 rounded-2xl border border-border shadow-sm flex flex-col justify-between gap-3 hover:border-brand-200 transition-colors">
                                <div>
                                  <button
                                    onClick={() => navigate(`/admin/customer/${c._id}`)}
                                    className="font-display font-bold text-sm text-gray-900 hover:text-brand-500 text-left transition-colors"
                                  >
                                    {c.name}
                                  </button>
                                  <p className="text-[10px] text-muted font-mono mt-0.5">{c.phone}</p>
                                  
                                  <div className="mt-2 space-y-1">
                                    <div className="flex justify-between text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                                      <span>Stages checklist</span>
                                      <span>{completedCount} / {pipelineStages.length}</span>
                                    </div>
                                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                      <div 
                                        className="h-full bg-brand-500 rounded-full" 
                                        style={{ width: `${(completedCount / (pipelineStages.length || 1)) * 100}%` }}
                                      />
                                    </div>
                                  </div>
                                </div>
                                <div>
                                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Move to Stage</label>
                                  <select
                                    onChange={(e) => handleMoveCustomerStage(c._id, e.target.value)}
                                    value={stage._id}
                                    className="w-full bg-[#FAFAFA] border border-border rounded-xl text-xs px-2 py-1.5 text-gray-800 focus:outline-none"
                                  >
                                    <option value="">None (Inbox)</option>
                                    {pipelineStages.map((ps) => (
                                      <option key={ps._id} value={ps._id}>{ps.name}</option>
                                    ))}
                                  </select>
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
        {/* Tab 6: Push Notifications */}
        {activeTab === 'push-notifications' && (
          <div className="space-y-8 animate-scale-in">
            {/* Header Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-display font-extrabold text-lg text-gray-900">Push Notifications Setup & Broadcast</h2>
                <p className="text-xs text-muted mt-0.5">Configure scheduled push notification text areas, fixed time / interval timers, and send instant alerts to all devices.</p>
              </div>
              <button
                onClick={openCreatePushConfigModal}
                className="btn-brand px-6 py-3 rounded-2xl flex items-center justify-center gap-2 text-sm shadow-brand hover:scale-[1.01] shrink-0"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                + New Notification Config
              </button>
            </div>

            {/* Config Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="bg-white rounded-3xl p-5 border border-border shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-500 font-extrabold uppercase tracking-wide">Total Configurations</span>
                  <span className="p-2 bg-brand-50 text-brand-600 rounded-xl">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </span>
                </div>
                <h3 className="font-display font-black text-2xl text-gray-900 mt-3">{pushConfigs.length}</h3>
                <p className="text-[10px] text-gray-400 font-bold mt-1">{pushConfigs.filter(c => c.isActive).length} currently active</p>
              </div>

              <div className="bg-white rounded-3xl p-5 border border-border shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-500 font-extrabold uppercase tracking-wide">Fixed Time Timers</span>
                  <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </span>
                </div>
                <h3 className="font-display font-black text-2xl text-gray-900 mt-3">{pushConfigs.filter(c => c.type === 'fixed').length}</h3>
                <p className="text-[10px] text-gray-400 font-bold mt-1">Scheduled at fixed hours</p>
              </div>

              <div className="bg-white rounded-3xl p-5 border border-border shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-500 font-extrabold uppercase tracking-wide">Interval Timers</span>
                  <span className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </span>
                </div>
                <h3 className="font-display font-black text-2xl text-gray-900 mt-3">{pushConfigs.filter(c => c.type === 'interval').length}</h3>
                <p className="text-[10px] text-gray-400 font-bold mt-1">Recurring interval alerts</p>
              </div>

              <div className="bg-white rounded-3xl p-5 border border-border shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-500 font-extrabold uppercase tracking-wide">Registered Devices</span>
                  <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </span>
                </div>
                <h3 className="font-display font-black text-2xl text-gray-900 mt-3">
                  {customers.filter(c => c.pushSubscription || c.fcmToken).length}
                </h3>
                <p className="text-[10px] text-emerald-600 font-bold mt-1">WebPush & FCM active</p>
              </div>
            </div>

            {/* Instant Push Broadcast Card */}
            <div className="bg-white border border-brand-200/80 rounded-[2.5rem] p-6 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-display font-extrabold text-base text-gray-900">Broadcast Instant Test Push Notification</h3>
                    <p className="text-xs text-muted">Send a live push notification instantly to all subscribed customer devices right now.</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-brand-50 border border-brand-200 text-brand-700 text-[10px] font-black rounded-full uppercase tracking-wide hidden sm:inline-block">
                  Live Dispatch
                </span>
              </div>

              <form onSubmit={handleSendInstantBroadcast} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Notification Title</label>
                    <input
                      type="text"
                      value={instantPushData.title}
                      onChange={(e) => setInstantPushData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g. Daily Health Reminder"
                      className="input-field w-full text-xs font-semibold"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Category & Action URL</label>
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={instantPushData.category}
                        onChange={(e) => setInstantPushData(prev => ({ ...prev, category: e.target.value }))}
                        className="input-field text-xs font-semibold"
                      >
                        <option value="general">General Wellness</option>
                        <option value="water">Water Reminder</option>
                        <option value="yoga">Yoga Session</option>
                        <option value="yoga">Yoga &amp; Fitness</option>
                        <option value="meditation">Meditation</option>
                        <option value="protein">Protein Log</option>
                      </select>
                      <input
                        type="text"
                        value={instantPushData.targetUrl}
                        onChange={(e) => setInstantPushData(prev => ({ ...prev, targetUrl: e.target.value }))}
                        placeholder="/tasks"
                        className="input-field text-xs font-semibold"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Message Text Area (Body)</label>
                  <textarea
                    rows={2}
                    value={instantPushData.body}
                    onChange={(e) => setInstantPushData(prev => ({ ...prev, body: e.target.value }))}
                    placeholder="Enter the broadcast push notification text message..."
                    className="input-field w-full text-xs font-medium resize-none"
                    required
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  {instantPushResult ? (
                    <p className="text-xs text-emerald-600 font-bold">
                      ✓ Broadcast Sent: {instantPushResult.sent} delivered / {instantPushResult.totalSubscribers} subscribers. ({instantPushResult.expired} expired cleaned)
                    </p>
                  ) : (
                    <span className="text-[11px] text-gray-400 font-semibold">Targets all registered WebPush & FCM user tokens</span>
                  )}
                  <button
                    type="submit"
                    disabled={instantPushLoading}
                    className="btn-brand px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm disabled:opacity-50"
                  >
                    {instantPushLoading ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Broadcasting...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                        Send Test Push Notification Now
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Scheduled Notification Configurations List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <div>
                  <h3 className="font-display font-extrabold text-base text-gray-900">Notification Configurations & Text Areas</h3>
                  <p className="text-xs text-muted">Manage scheduled notification message text areas and timing behavior.</p>
                </div>
                <span className="text-xs text-gray-400 font-bold">{pushConfigs.length} Configured</span>
              </div>

              {pushConfigsLoading ? (
                <div className="bg-white p-12 rounded-[2.5rem] border border-border text-center">
                  <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-xs font-bold text-gray-500">Loading configurations...</p>
                </div>
              ) : pushConfigs.length === 0 ? (
                <div className="bg-white p-12 rounded-[2.5rem] border border-border text-center">
                  <div className="w-12 h-12 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </div>
                  <h4 className="font-display font-bold text-sm text-gray-900 mb-1">No Notification Configurations Yet</h4>
                  <p className="text-xs text-muted max-w-sm mx-auto mb-4">Click below to add fixed time or interval push notification text templates.</p>
                  <button
                    onClick={openCreatePushConfigModal}
                    className="btn-brand px-5 py-2.5 rounded-xl text-xs font-bold"
                  >
                    + Create First Notification Config
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {pushConfigs.map((cfg) => (
                    <div
                      key={cfg._id}
                      className={`bg-white border rounded-[2rem] p-6 shadow-sm flex flex-col justify-between gap-4 transition-all hover:border-brand-200 ${
                        cfg.isActive ? 'border-border' : 'border-gray-200 opacity-60 bg-gray-50/50'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider ${
                              cfg.category === 'water' ? 'bg-cyan-50 text-cyan-700 border border-cyan-200' :
                              cfg.category === 'yoga' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                              cfg.category === 'meditation' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                              cfg.category === 'protein' ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                              'bg-gray-100 text-gray-700 border border-gray-200'
                            }`}>
                              {cfg.category || 'general'}
                            </span>
                            <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black tracking-wider flex items-center gap-1 ${
                              cfg.type === 'fixed' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                              {cfg.type === 'fixed' ? (
                                <>⏰ Fixed at {cfg.fixedTime}</>
                              ) : (
                                <>🔄 Every {cfg.intervalMinutes} mins</>
                              )}
                            </span>
                          </div>

                          {/* Toggle Active Switch */}
                          <button
                            onClick={() => handleTogglePushConfigActive(cfg)}
                            className={`px-3 py-1 rounded-full text-[10px] font-black transition-colors ${
                              cfg.isActive
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-gray-200 text-gray-600 border border-gray-300'
                            }`}
                          >
                            {cfg.isActive ? '● Active' : '○ Paused'}
                          </button>
                        </div>

                        <div>
                          <h4 className="font-display font-extrabold text-base text-gray-900">{cfg.title}</h4>
                          <p className="text-xs text-gray-600 bg-gray-50 border border-gray-100 p-3 rounded-2xl mt-2 leading-relaxed whitespace-pre-line">
                            "{cfg.body}"
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <span className="text-[10px] text-gray-400 font-bold font-mono">
                          Target: {cfg.targetUrl || '/'}
                        </span>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => openEditPushConfigModal(cfg)}
                            className="text-xs text-brand-600 font-bold hover:underline"
                          >
                            Edit Text
                          </button>
                          <button
                            onClick={() => handleDeletePushConfig(cfg)}
                            className="text-xs text-red-500 font-bold hover:underline"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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

      {/* Push Notification Configuration Modal */}
      {isPushConfigModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => !pushConfigFormLoading && setIsPushConfigModalOpen(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
          />
          <div className="relative bg-white rounded-[2.5rem] max-w-lg w-full p-6 md:p-8 shadow-2xl border border-border space-y-6 animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h3 className="font-display font-extrabold text-lg text-gray-900">
                  {editingPushConfig ? 'Edit Push Notification' : 'Create Push Notification'}
                </h3>
                <p className="text-xs text-muted">Configure message text area content and timing schedule.</p>
              </div>
              <button
                onClick={() => setIsPushConfigModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-xl hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            {pushConfigFormError && (
              <div className="bg-red-50 text-red-600 p-3.5 rounded-2xl text-xs font-semibold border border-red-200">
                {pushConfigFormError}
              </div>
            )}

            <form onSubmit={handleSavePushConfig} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Notification Title *</label>
                <input
                  type="text"
                  value={pushConfigFormData.title}
                  onChange={(e) => setPushConfigFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. Drink Water Reminder"
                  className="input-field w-full text-xs font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Notification Message Text Area (Body) *</label>
                <textarea
                  rows={3}
                  value={pushConfigFormData.body}
                  onChange={(e) => setPushConfigFormData(prev => ({ ...prev, body: e.target.value }))}
                  placeholder="Enter the push notification message body text..."
                  className="input-field w-full text-xs font-medium resize-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Category</label>
                  <select
                    value={pushConfigFormData.category}
                    onChange={(e) => setPushConfigFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="input-field w-full text-xs font-semibold"
                  >
                    <option value="water">💧 Water Reminder</option>
                    <option value="yoga">🧘 Yoga Session</option>
                    <option value="yoga">🧘 Yoga &amp; Fitness</option>
                    <option value="meditation">🧠 Meditation</option>
                    <option value="protein">🥗 Protein Log</option>
                    <option value="general">✨ General Wellness</option>
                    <option value="custom">🔔 Custom</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Target App Link</label>
                  <input
                    type="text"
                    value={pushConfigFormData.targetUrl}
                    onChange={(e) => setPushConfigFormData(prev => ({ ...prev, targetUrl: e.target.value }))}
                    placeholder="/tasks"
                    className="input-field w-full text-xs font-semibold"
                  />
                </div>
              </div>

              {/* Timing Selection Mode */}
              <div className="bg-gray-50 border border-gray-200 p-4 rounded-2xl space-y-3">
                <label className="block text-xs font-bold text-gray-800">Notification Timing Mode</label>
                
                <div className="grid grid-cols-2 gap-3">
                  <label className={`p-3 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                    pushConfigFormData.type === 'fixed' ? 'bg-white border-brand-500 shadow-sm text-brand-700' : 'bg-gray-100 border-transparent text-gray-600'
                  }`}>
                    <input
                      type="radio"
                      name="timingType"
                      value="fixed"
                      checked={pushConfigFormData.type === 'fixed'}
                      onChange={() => setPushConfigFormData(prev => ({ ...prev, type: 'fixed' }))}
                      className="accent-brand-500"
                    />
                    <span className="text-xs font-bold">Fixed Time</span>
                  </label>

                  <label className={`p-3 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                    pushConfigFormData.type === 'interval' ? 'bg-white border-brand-500 shadow-sm text-brand-700' : 'bg-gray-100 border-transparent text-gray-600'
                  }`}>
                    <input
                      type="radio"
                      name="timingType"
                      value="interval"
                      checked={pushConfigFormData.type === 'interval'}
                      onChange={() => setPushConfigFormData(prev => ({ ...prev, type: 'interval' }))}
                      className="accent-brand-500"
                    />
                    <span className="text-xs font-bold">Constant Interval</span>
                  </label>
                </div>

                {pushConfigFormData.type === 'fixed' ? (
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">Fixed Delivery Time (24-hr)</label>
                    <input
                      type="time"
                      value={pushConfigFormData.fixedTime}
                      onChange={(e) => setPushConfigFormData(prev => ({ ...prev, fixedTime: e.target.value }))}
                      className="input-field w-full text-xs font-bold"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">Constant Interval Duration</label>
                    <select
                      value={pushConfigFormData.intervalMinutes}
                      onChange={(e) => setPushConfigFormData(prev => ({ ...prev, intervalMinutes: Number(e.target.value) }))}
                      className="input-field w-full text-xs font-bold"
                    >
                      <option value={30}>Every 30 Minutes</option>
                      <option value={60}>Every 1 Hour (60 mins)</option>
                      <option value={120}>Every 2 Hours (120 mins)</option>
                      <option value={180}>Every 3 Hours (180 mins)</option>
                      <option value={240}>Every 4 Hours (240 mins)</option>
                      <option value={360}>Every 6 Hours (360 mins)</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isActiveToggle"
                  checked={pushConfigFormData.isActive}
                  onChange={(e) => setPushConfigFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="w-4 h-4 accent-brand-500 rounded"
                />
                <label htmlFor="isActiveToggle" className="text-xs font-bold text-gray-700 cursor-pointer">
                  Enable notification configuration immediately
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsPushConfigModalOpen(false)}
                  className="px-5 py-2.5 text-xs font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pushConfigFormLoading}
                  className="btn-brand px-6 py-2.5 rounded-xl text-xs font-bold shadow-sm"
                >
                  {pushConfigFormLoading ? 'Saving...' : editingPushConfig ? 'Update Config' : 'Save Config'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
          />

          <div className="bg-white w-full max-w-lg rounded-[2.5rem] border border-border shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh] animate-scale-in">
            <div className="px-6 py-5 border-b border-border bg-gradient-to-r from-brand-50/50 to-transparent flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-display font-extrabold text-lg text-gray-900">
                  {editingCustomer ? 'Edit Customer' : 'Create New Customer'}
                </h3>
              </div>
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">CRM Pipeline</label>
                    <select
                      name="pipelineId"
                      value={formData.pipelineId}
                      onChange={(e) => {
                        handleInputChange(e);
                        setFormData(prev => ({ ...prev, currentStageId: '' }));
                      }}
                      className="w-full rounded-2xl border border-border bg-[#FAFAFA] px-3 py-3 text-sm focus:outline-none text-gray-900"
                    >
                      <option value="">None (No Pipeline)</option>
                      {pipelines.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Pipeline Stage</label>
                    <select
                      name="currentStageId"
                      value={formData.currentStageId}
                      onChange={handleInputChange}
                      disabled={!formData.pipelineId}
                      className="w-full rounded-2xl border border-border bg-[#FAFAFA] px-3 py-3 text-sm focus:outline-none text-gray-900 disabled:opacity-75 disabled:bg-gray-100"
                    >
                      <option value="">None (Inbox / Unassigned)</option>
                      {formPipelineStages.map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
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
                  className="flex-1 btn-brand py-3 rounded-2xl font-bold text-sm text-white shadow-brand"
                >
                  {formLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Batch Modal */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => !batchFormLoading && setIsBatchModalOpen(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
          />

          <div className="bg-white w-full max-w-md rounded-[2.5rem] border border-border shadow-2xl relative overflow-hidden flex flex-col animate-scale-in">
            <div className="px-6 py-5 border-b border-border bg-gradient-to-r from-brand-50/50 to-transparent flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-display font-extrabold text-lg text-gray-900">
                  {editingBatch ? 'Edit Batch' : 'Create Batch'}
                </h3>
              </div>
              <button
                disabled={batchFormLoading}
                onClick={() => setIsBatchModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200/80 flex items-center justify-center text-gray-500"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveBatch} className="px-6 py-5 space-y-4">
              {batchFormError && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-3 text-xs text-red-700 font-bold">
                  {batchFormError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Batch Name *</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={batchFormData.name}
                  onChange={handleBatchInputChange}
                  placeholder="e.g. Batch of July 2026"
                  className="w-full rounded-2xl border border-border bg-[#FAFAFA] px-4 py-3 text-sm focus:outline-none text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Challenge Start Date *</label>
                <input
                  type="date"
                  name="startDate"
                  required
                  value={batchFormData.startDate}
                  onChange={handleBatchInputChange}
                  className="w-full rounded-2xl border border-border bg-[#FAFAFA] px-4 py-3 text-sm focus:outline-none text-gray-900"
                />
              </div>

              <div className="flex gap-3 pt-4 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsBatchModalOpen(false)}
                  className="flex-1 py-3 bg-gray-100 rounded-2xl font-bold text-sm text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={batchFormLoading}
                  className="flex-1 btn-brand py-3 rounded-2xl font-bold text-sm text-white shadow-brand"
                >
                  {batchFormLoading ? 'Saving...' : 'Save Batch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Creation/Edit Package Modal */}
      {isPackageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => !packageFormLoading && setIsPackageModalOpen(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
          />

          <div className="bg-white w-full max-w-md rounded-[2.5rem] border border-border shadow-2xl relative overflow-hidden flex flex-col animate-scale-in">
            <div className="px-6 py-5 border-b border-border bg-gradient-to-r from-brand-50/50 to-transparent flex items-center justify-between shrink-0">
              <h3 className="font-display font-extrabold text-lg text-gray-900">
                {editingPackage ? 'Edit Package' : 'Create New Package'}
              </h3>
              <button
                disabled={packageFormLoading}
                onClick={() => setIsPackageModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200/80 flex items-center justify-center text-gray-500 transition-colors"
              >
                &times;
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

              <div className="flex gap-3 pt-4 shrink-0">
                <button
                  type="button"
                  disabled={packageFormLoading}
                  onClick={() => setIsPackageModalOpen(false)}
                  className="flex-1 py-3.5 border border-border text-gray-700 font-bold text-sm rounded-2xl hover:bg-gray-50 transition-all active:scale-[0.99] disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={packageFormLoading}
                  className="flex-1 btn-brand py-3.5 font-bold text-sm rounded-2xl shadow-brand hover:scale-[1.01] active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
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
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
          />

          <div className="bg-white w-full max-w-lg rounded-[2.5rem] border border-border shadow-2xl relative overflow-hidden flex flex-col animate-scale-in">
            <div className="px-6 py-5 border-b border-border bg-gradient-to-r from-brand-50/50 to-transparent flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-display font-extrabold text-lg text-gray-900">
                  {editingTicket ? 'Edit Enquiry Ticket' : 'Create Enquiry Ticket'}
                </h3>
              </div>
              <button
                disabled={ticketFormLoading}
                onClick={() => setIsTicketModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200/80 flex items-center justify-center text-gray-500"
              >
                &times;
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

              <div className="flex gap-3 pt-4 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsTicketModalOpen(false)}
                  className="flex-1 py-3 bg-gray-100 rounded-2xl font-bold text-sm text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={ticketFormLoading}
                  className="flex-1 btn-brand py-3 rounded-2xl font-bold text-sm text-white shadow-brand"
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
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
          />

          <div className="bg-white w-full max-w-5xl h-[90vh] rounded-[2.5rem] border border-border shadow-2xl relative overflow-hidden flex flex-col animate-scale-in">
            
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-border bg-gradient-to-r from-brand-50/50 to-transparent flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-brand-100 text-brand-700 flex items-center justify-center font-display font-extrabold text-sm border border-brand-200">
                  {taskViewerCustomer.name?.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-display font-extrabold text-lg text-gray-900">
                    {taskViewerCustomer.name}
                  </h3>
                  <p className="text-xs text-muted mt-0.5">
                    Phone: {taskViewerCustomer.phone} · Start Date: {taskViewerCustomer.startDate ? new Date(taskViewerCustomer.startDate).toLocaleDateString() : '—'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setTaskViewerCustomer(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200/80 flex items-center justify-center text-gray-500 font-bold"
              >
                &times;
              </button>
            </div>

            {/* Profile Sub-tabs Selection */}
            <div className="flex gap-6 border-b border-gray-200 px-6 pt-3 select-none">
              <button
                onClick={() => setProfileSubTab('overview')}
                className={`pb-2.5 font-display font-extrabold text-xs border-b-2 transition-all ${
                  profileSubTab === 'overview' ? 'border-brand-500 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Overview & Analytics
              </button>
              <button
                onClick={() => setProfileSubTab('tasks')}
                className={`pb-2.5 font-display font-extrabold text-xs border-b-2 transition-all ${
                  profileSubTab === 'tasks' ? 'border-brand-500 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'
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
                              Day {getCurrentDayNumberLocal(taskViewerCustomer.startDate)} / 30
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
                const customerDayNum = getCurrentDayNumberLocal(taskViewerCustomer.startDate);
                return (
                  <div className="flex-1 flex flex-col md:flex-row overflow-hidden h-[60vh]">
                    {/* Left: 30 Days grid */}
                    <div className="w-full md:w-3/5 p-6 overflow-y-auto border-b md:border-b-0 md:border-r border-border h-full">
                      <p className="text-xs font-black uppercase text-muted tracking-widest mb-4">30 Days timeline</p>
                      {tasksLoading ? (
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                          {Array.from({ length: 30 }).map((_, idx) => (
                            <div key={idx} className="h-16 rounded-2xl bg-gray-100 skeleton" />
                          ))}
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                          {Array.from({ length: 30 }).map((_, idx) => {
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl border border-border p-6 md:p-8 max-w-2xl w-full shadow-2xl space-y-6 max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center shrink-0">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-brand-700 bg-brand-50 border border-brand-100 px-2.5 py-1 rounded-lg">Batch Roster</span>
                <h3 className="font-display font-extrabold text-lg text-gray-900 mt-1">{viewingBatchMembers.name}</h3>
                <p className="text-xs text-muted">
                  Starts: {new Date(viewingBatchMembers.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              <button
                onClick={() => setViewingBatchMembers(null)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-colors"
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
