import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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

export default function CustomerDetail() {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const api = useApi();
  const { logout, user: adminUser } = useUserStore();

  const [customer, setCustomer] = useState(null);
  const [customerTasks, setCustomerTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [error, setError] = useState('');
  const [profileSubTab, setProfileSubTab] = useState('overview'); // 'overview' | 'tasks'
  const [selectedTaskDay, setSelectedTaskDay] = useState(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Edit / Delete states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [packages, setPackages] = useState([]);
  const [batches, setBatches] = useState([]);
  const [salesReps, setSalesReps] = useState([]);
  const [pipelines, setPipelines] = useState([]);
  const [pipelineStages, setPipelineStages] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
    packageId: '',
    batchId: '',
    salesRepId: '',
    pipelineId: '',
    currentStageId: '',
    age: '',
    heightCm: '',
    weightKg: '',
    gender: 'male',
    startDate: '',
  });

  useEffect(() => {
    fetchCustomerDetails();
    fetchPackages();
    fetchBatches();
    fetchSalesReps();
    fetchPipelines();
  }, [customerId]);

  useEffect(() => {
    if (formData.pipelineId) {
      fetchPipelineStages(formData.pipelineId);
    } else {
      setPipelineStages([]);
    }
  }, [formData.pipelineId]);

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

  const fetchPipelines = async () => {
    try {
      const data = await api.get('/api/admin/pipelines');
      setPipelines(data.pipelines || []);
    } catch (err) {
      console.error('Failed to fetch pipelines:', err);
    }
  };

  const fetchPipelineStages = async (pipelineId) => {
    try {
      const data = await api.get(`/api/admin/pipeline-stages?pipelineId=${pipelineId}`);
      setPipelineStages(data.stages || []);
    } catch (err) {
      console.error('Failed to fetch stages:', err);
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
      pipelineId: customer.pipelineId?._id || customer.pipelineId || '',
      currentStageId: customer.currentStageId?._id || customer.currentStageId || '',
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
        pipelineId: formData.pipelineId || null,
        currentStageId: formData.currentStageId || null,
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
      navigate('/admin', { state: { activeTab: 'customers' } });
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to delete customer');
    }
  };

  const getCurrentDayNumberLocal = (startDate) => getCurrentDayNumber(startDate);

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

  async function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="min-h-screen bg-[#FDF9F7] text-gray-900 flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-border flex flex-col justify-between transition-transform duration-300 transform md:translate-x-0 md:static md:h-screen shrink-0 ${
        isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-6 border-b border-border flex items-center gap-3">
          <img src="/eldropluslogomain.png" alt="eldroplus" className="w-9 h-9 object-contain rounded-lg" />
          <div>
            <h1 className="font-display font-extrabold text-base text-gray-900 leading-none">
              eldroplus CRM
            </h1>
            <span className="text-[9px] tracking-wider text-muted font-bold uppercase mt-1 block">Control Panel</span>
          </div>
        </div>

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
            { id: 'onboarding', label: 'Onboarding & Batches', icon: (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
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
            )}
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => navigate('/admin', { state: { activeTab: item.id } })}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
                item.id === 'customers'
                  ? 'bg-brand-500 text-white shadow-brand hover:bg-brand-600'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-border space-y-2">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center font-display font-bold text-xs text-gray-700">
              {adminUser?.name?.slice(0, 2).toUpperCase() || 'AD'}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-gray-900 truncate">{adminUser?.name || 'Admin User'}</p>
              <p className="text-[10px] text-muted font-bold uppercase truncate">{adminUser?.role || 'Admin'}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold text-red-500 hover:text-red-600 hover:bg-red-50/50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-20 bg-white border-b border-border px-4 md:px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="p-2 text-gray-500 hover:text-gray-700 md:hidden hover:bg-gray-50 rounded-xl border border-border"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h2 className="font-display font-extrabold text-sm md:text-base text-gray-900 flex items-center gap-2">
              <button
                onClick={() => navigate('/admin', { state: { activeTab: 'customers' } })}
                className="text-brand-500 hover:underline"
              >
                Customers Directory
              </button>
              <span className="text-gray-400">/</span>
              <span>{customer?.name || 'Customer Details'}</span>
            </h2>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto overflow-y-auto">
          {loading ? (
            <div className="space-y-6">
              <div className="h-20 bg-white border border-border rounded-3xl skeleton" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="h-32 bg-white border border-border rounded-3xl skeleton" />
                <div className="md:col-span-2 h-32 bg-white border border-border rounded-3xl skeleton" />
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-600 border border-red-200 rounded-3xl p-6 text-center">
              <h3 className="font-display font-extrabold text-lg mb-2">Error Loading Details</h3>
              <p className="text-sm font-medium mb-4">{error}</p>
              <button
                onClick={() => navigate('/admin', { state: { activeTab: 'customers' } })}
                className="btn-brand px-6 py-2.5 rounded-xl text-xs font-bold shadow-brand"
              >
                Back to Directory
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {successMsg && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl p-4 text-xs font-bold">
                  {successMsg}
                </div>
              )}

              {/* Profile Card Header */}
              <div className="bg-white border border-border rounded-[2.5rem] p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-brand-100 text-brand-700 flex items-center justify-center font-display font-extrabold text-lg border border-brand-200">
                    {customer.name?.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-display font-extrabold text-xl text-gray-900 leading-tight">
                      {customer.name}
                    </h3>
                    <p className="text-xs text-muted mt-1 font-semibold">
                      Phone: {customer.phone} · Start Date: {customer.startDate ? new Date(customer.startDate).toLocaleDateString() : '—'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={openEditModal}
                    className="px-5 py-2.5 bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 rounded-2xl text-xs font-bold transition-colors"
                  >
                    Edit Profile
                  </button>
                  <button
                    onClick={handleDeleteCustomer}
                    className="px-5 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-2xl text-xs font-bold transition-colors"
                  >
                    Delete Customer
                  </button>
                  <button
                    onClick={() => navigate('/admin', { state: { activeTab: 'customers' } })}
                    className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200/70 border border-border rounded-2xl text-xs font-bold text-gray-700 transition-colors"
                  >
                    Back to Directory
                  </button>
                </div>
              </div>

              {/* Sub-tabs Selection */}
              <div className="flex gap-6 border-b border-gray-200 px-2 pt-1 select-none">
                <button
                  onClick={() => setProfileSubTab('overview')}
                  className={`pb-3.5 font-display font-extrabold text-xs border-b-2 transition-all ${
                    profileSubTab === 'overview' ? 'border-brand-500 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Overview & Analytics
                </button>
                <button
                  onClick={() => setProfileSubTab('tasks')}
                  className={`pb-3.5 font-display font-extrabold text-xs border-b-2 transition-all ${
                    profileSubTab === 'tasks' ? 'border-brand-500 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Daily Tasks Timeline
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
                        <div className="md:col-span-1 border border-brand-500/10 rounded-3xl p-5 bg-gradient-to-br from-brand-50 to-[#E2F0E7] flex flex-col justify-center gap-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-brand-600 font-extrabold uppercase tracking-widest">Active Day</span>
                            <span className="bg-brand-500/10 border border-brand-500/20 text-brand-700 text-[10px] font-bold px-2 py-0.5 rounded-lg">
                              Day {getCurrentDayNumberLocal(customer.startDate)} / 30
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
                        <div className="md:col-span-2 bg-white border border-border rounded-3xl p-5 flex flex-col justify-between">
                          <h4 className="font-display font-extrabold text-sm text-gray-900 border-b border-border pb-2 mb-3">Customer Health Profile</h4>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-semibold text-gray-700">
                            <div>
                              <p className="text-muted text-[10px] uppercase font-bold">Age</p>
                              <p className="text-sm font-display font-black text-gray-900 mt-1">{customer.age ? `${customer.age} yrs` : '—'}</p>
                            </div>
                            <div>
                              <p className="text-muted text-[10px] uppercase font-bold">Gender</p>
                              <p className="text-sm font-display font-black text-gray-900 mt-1 capitalize">{customer.gender || '—'}</p>
                            </div>
                            <div>
                              <p className="text-muted text-[10px] uppercase font-bold">Height & Weight</p>
                              <p className="text-sm font-display font-black text-gray-900 mt-1">{customer.heightCm ? `${customer.heightCm} cm` : '—'} / {customer.weightKg ? `${customer.weightKg} kg` : '—'}</p>
                            </div>
                            <div>
                              <p className="text-muted text-[10px] uppercase font-bold">BMI Category</p>
                              {calcBMI(customer.heightCm, customer.weightKg) ? (
                                <p className="text-sm font-display font-black text-gray-900 mt-1">
                                  {calcBMI(customer.heightCm, customer.weightKg).toFixed(1)} ({getBMICategory(calcBMI(customer.heightCm, customer.weightKg)).label})
                                </p>
                              ) : <p className="text-sm font-display font-black text-gray-900 mt-1">—</p>}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Stats Grid */}
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
                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Average Sleep Duration</p>
                          <h3 className="font-display font-black text-xl text-indigo-600 mt-1.5">{stats.avgSleep ? `${stats.avgSleep} hrs` : '0 hrs'}</h3>
                        </div>
                      </div>

                      {/* Progress charts */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Yoga Sessions chart */}
                        <div className="bg-white border border-border rounded-[2rem] p-5 shadow-sm">
                          <h4 className="font-display font-extrabold text-xs text-gray-800 uppercase tracking-widest mb-4">Yoga & Fitness minutes</h4>
                          <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={stats.yogaData}>
                                <defs>
                                  <linearGradient id="yogaGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
                                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                                <XAxis dataKey="day" stroke="#9CA3AF" fontSize={10} tickLine={false} />
                                <YAxis stroke="#9CA3AF" fontSize={10} tickLine={false} />
                                <Tooltip content={<CustomTooltip unit="min" />} />
                                <Area type="monotone" dataKey="val" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#yogaGrad)" />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* Meditation Sessions chart */}
                        <div className="bg-white border border-border rounded-[2rem] p-5 shadow-sm">
                          <h4 className="font-display font-extrabold text-xs text-gray-800 uppercase tracking-widest mb-4">Meditation minutes</h4>
                          <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={stats.meditationData}>
                                <defs>
                                  <linearGradient id="meditationGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#9333ea" stopOpacity={0.25} />
                                    <stop offset="95%" stopColor="#9333ea" stopOpacity={0.0} />
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                                <XAxis dataKey="day" stroke="#9CA3AF" fontSize={10} tickLine={false} />
                                <YAxis stroke="#9CA3AF" fontSize={10} tickLine={false} />
                                <Tooltip content={<CustomTooltip unit="min" />} />
                                <Area type="monotone" dataKey="val" stroke="#9333ea" strokeWidth={2} fillOpacity={1} fill="url(#meditationGrad)" />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* Water Hydration chart */}
                        <div className="bg-white border border-border rounded-[2rem] p-5 shadow-sm">
                          <h4 className="font-display font-extrabold text-xs text-gray-800 uppercase tracking-widest mb-4">Water Hydration (ml)</h4>
                          <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={stats.waterData}>
                                <defs>
                                  <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.25} />
                                    <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.0} />
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                                <XAxis dataKey="day" stroke="#9CA3AF" fontSize={10} tickLine={false} />
                                <YAxis stroke="#9CA3AF" fontSize={10} tickLine={false} />
                                <Tooltip content={<CustomTooltip unit="ml" />} />
                                <Area type="monotone" dataKey="val" stroke="#06B6D4" strokeWidth={2} fillOpacity={1} fill="url(#waterGrad)" />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* Sleep logs chart */}
                        <div className="bg-white border border-border rounded-[2rem] p-5 shadow-sm">
                          <h4 className="font-display font-extrabold text-xs text-gray-800 uppercase tracking-widest mb-4">Sleep duration (hrs)</h4>
                          <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={stats.sleepData}>
                                <defs>
                                  <linearGradient id="sleepGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.25} />
                                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                                <XAxis dataKey="day" stroke="#9CA3AF" fontSize={10} tickLine={false} />
                                <YAxis stroke="#9CA3AF" fontSize={10} tickLine={false} />
                                <Tooltip content={<CustomTooltip unit="hrs" />} />
                                <Area type="monotone" dataKey="val" stroke="#6366F1" strokeWidth={2} fillOpacity={1} fill="url(#sleepGrad)" />
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
                  
                  {/* Left Column: 30-Day Grid */}
                  <div className="lg:col-span-8 bg-white border border-border rounded-[2rem] p-6 shadow-sm">
                    <div className="flex items-center justify-between border-b border-border pb-3 mb-5">
                      <h4 className="font-display font-extrabold text-sm text-gray-900">30-Day Challenge Timeline</h4>
                      <p className="text-[10px] text-muted font-bold uppercase">Click any day to view/edit logs</p>
                    </div>

                    <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-10 gap-3.5">
                      {Array.from({ length: 30 }, (_, i) => {
                        const dayNum = i + 1;
                        const customerDayNum = getCurrentDayNumberLocal(customer.startDate);
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
            </div>
          )}
        </main>
      </div>

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
                      {pipelineStages.map((s) => (
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
