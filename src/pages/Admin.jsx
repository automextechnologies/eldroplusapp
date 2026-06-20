import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../store/useUserStore';
import { useApi } from '../hooks/useApi';
import { calcBMI, getBMICategory } from '../utils/bmiCalc';

export default function Admin() {
  const navigate = useNavigate();
  const api = useApi();
  const { logout, user: adminUser } = useUserStore();

  const [customers, setCustomers] = useState([]);
  const [batches, setBatches] = useState([]);
  const [activeTab, setActiveTab] = useState('customers'); // 'customers' | 'batches'
  const [selectedBatchFilter, setSelectedBatchFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
    age: '',
    gender: 'male',
    heightCm: '',
    weightKg: '',
    startDate: new Date().toISOString().split('T')[0],
    batchId: '',
  });

  // Batch Form State
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);
  const [batchFormData, setBatchFormData] = useState({
    name: '',
    startDate: new Date().toISOString().split('T')[0],
  });
  const [batchFormLoading, setBatchFormLoading] = useState(false);
  const [batchFormError, setBatchFormError] = useState('');

  // Customer Tasks States
  const [taskViewerCustomer, setTaskViewerCustomer] = useState(null);
  const [customerTasks, setCustomerTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [selectedTaskDay, setSelectedTaskDay] = useState(null);

  useEffect(() => {
    fetchCustomers();
    fetchBatches();
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

  async function handleLogout() {
    logout();
    navigate('/login');
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      if (name === 'batchId' && value) {
        const selectedBatch = batches.find((b) => b._id === value);
        if (selectedBatch) {
          next.startDate = new Date(selectedBatch.startDate).toISOString().split('T')[0];
        }
      }
      return next;
    });
  };

  const handleBatchInputChange = (e) => {
    const { name, value } = e.target;
    setBatchFormData((prev) => ({ ...prev, [name]: value }));
  };

  const openCreateModal = () => {
    setEditingCustomer(null);
    setFormData({
      name: '',
      phone: '',
      password: '',
      age: '',
      gender: 'male',
      heightCm: '',
      weightKg: '',
      startDate: new Date().toISOString().split('T')[0],
      batchId: '',
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
      gender: customer.gender || 'male',
      heightCm: customer.heightCm !== undefined ? String(customer.heightCm) : '',
      weightKg: customer.weightKg !== undefined ? String(customer.weightKg) : '',
      startDate: customer.startDate ? new Date(customer.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      batchId: customer.batchId?._id || customer.batchId || '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);

    // Basic Validation
    if (!formData.name.trim()) { setFormError('Name is required'); setFormLoading(false); return; }
    if (!formData.phone.trim()) { setFormError('Phone number is required'); setFormLoading(false); return; }
    if (!editingCustomer && !formData.password.trim()) { setFormError('Password is required'); setFormLoading(false); return; }
    if (!formData.batchId) { setFormError('Assigning the customer to a batch or class is required'); setFormLoading(false); return; }

    try {
      const payload = {
        ...formData,
        age: formData.age ? Number(formData.age) : undefined,
        heightCm: formData.heightCm ? Number(formData.heightCm) : undefined,
        weightKg: formData.weightKg ? Number(formData.weightKg) : undefined,
        batchId: formData.batchId || null,
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
      }

      setIsModalOpen(false);
      setTimeout(() => setSuccessMsg(''), 5000);
      fetchBatches();
    } catch (err) {
      setFormError(err.message || 'Failed to save customer');
    } finally {
      setFormLoading(false);
    }
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

  const openTaskViewer = async (customer) => {
    setTaskViewerCustomer(customer);
    setCustomerTasks([]);
    setTasksLoading(true);
    setSelectedTaskDay(null);
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

  // Stats Calculations
  const totalCount = customers.length;
  
  const ageCustomers = customers.filter((c) => typeof c.age === 'number' && c.age > 0);
  const avgAge = ageCustomers.length
    ? Math.round(ageCustomers.reduce((acc, c) => acc + c.age, 0) / ageCustomers.length)
    : 0;

  const weightCustomers = customers.filter((c) => typeof c.weightKg === 'number' && c.weightKg > 0);
  const avgWeight = weightCustomers.length
    ? Math.round((weightCustomers.reduce((acc, c) => acc + c.weightKg, 0) / weightCustomers.length) * 10) / 10
    : 0;

  const validBmis = customers
    .map((c) => calcBMI(c.heightCm, c.weightKg))
    .filter((bmi) => bmi !== null);
  const avgBmi = validBmis.length
    ? Math.round((validBmis.reduce((acc, b) => acc + b, 0) / validBmis.length) * 10) / 10
    : 0;

  // Filtered List
  const filteredCustomers = customers.filter(
    (c) =>
      (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.phone || '').includes(searchQuery)
  );

  return (
    <div className="min-h-screen bg-[#FDF9F7] text-gray-900 pb-20">
      {/* Premium Top Navigation */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-border px-4 py-4 md:px-8 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-display font-extrabold text-xl shadow-brand">
              E+
            </div>
            <div>
              <h1 className="font-display font-extrabold text-lg md:text-xl text-gray-900 flex items-center gap-2">
                Eldro<span className="text-brand-500 font-black">+</span> Admin
              </h1>
              <p className="text-[10px] tracking-wider text-muted font-bold uppercase">Control Panel</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline text-sm font-semibold text-gray-600">
              Welcome, <span className="text-gray-900">{adminUser?.name || 'Administrator'}</span>
            </span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100/80 rounded-xl border border-red-200 transition-colors flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 mt-8">
        
        {/* Banner Messages */}
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


        {/* Tabs Bar */}
        <div className="flex gap-6 border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('customers')}
            className={`pb-3 font-display font-extrabold text-sm border-b-2 transition-all ${
              activeTab === 'customers' ? 'border-brand-500 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Customers Directory
          </button>
          <button
            onClick={() => setActiveTab('batches')}
            className={`pb-3 font-display font-extrabold text-sm border-b-2 transition-all ${
              activeTab === 'batches' ? 'border-brand-500 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Batches & Classes
          </button>
        </div>

        {activeTab === 'customers' ? (
          <>
            {/* Search & Actions Bar */}
            <section className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between mb-6">
              <div className="flex flex-col sm:flex-row gap-3 flex-1 max-w-2xl">
                <div className="relative flex-1">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    placeholder="Search by name or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-500 transition-all placeholder:text-gray-400 text-gray-900"
                  />
                </div>
                <select
                  value={selectedBatchFilter}
                  onChange={(e) => setSelectedBatchFilter(e.target.value)}
                  className="rounded-2xl border border-border bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-500 transition-all text-gray-900"
                >
                  <option value="">All Batches / Classes</option>
                  {batches.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={openCreateModal}
                className="btn-brand sm:w-auto px-6 py-3 rounded-2xl flex items-center justify-center gap-2 text-sm shadow-brand hover:scale-[1.01]"
                style={{ minHeight: '46px' }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                </svg>
                Create Customer
              </button>
            </section>

            {/* Customer Listing */}
            <section className="bg-white rounded-3xl border border-border shadow-sm overflow-hidden">
              <div className="p-6 border-b border-border flex items-center justify-between">
                <h2 className="font-display font-extrabold text-base text-gray-900">
                  Customers Directory
                </h2>
                <span className="px-2.5 py-1 bg-brand-50 text-brand-700 text-xs font-bold rounded-lg border border-brand-100">
                  {customers.filter(c => selectedBatchFilter ? (c.batchId?._id || c.batchId) === selectedBatchFilter : true).length} total
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
              ) : customers.filter(c => {
                const matchesSearch = (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || (c.phone || '').includes(searchQuery);
                const matchesBatch = selectedBatchFilter ? (c.batchId?._id || c.batchId) === selectedBatchFilter : true;
                return matchesSearch && matchesBatch;
              }).length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center justify-center">
                  <div className="w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-500 mb-4 border border-brand-100">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <h3 className="font-display font-bold text-gray-900 mb-1">No customers found</h3>
                  <p className="text-sm text-gray-500 max-w-xs">
                    {searchQuery || selectedBatchFilter ? 'Adjust your filters to see more entries.' : 'Add your first customer by clicking the button above.'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="bg-gradient-to-r from-brand-50/40 to-transparent border-b border-border">
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Customer</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Batch / Class</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Details</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Body Stats & BMI</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Joined & Start</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {customers
                        .filter(c => {
                          const matchesSearch = (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || (c.phone || '').includes(searchQuery);
                          const matchesBatch = selectedBatchFilter ? (c.batchId?._id || c.batchId) === selectedBatchFilter : true;
                          return matchesSearch && matchesBatch;
                        })
                        .map((customer) => {
                          const initials = customer.name
                            ?.split(' ')
                            .filter(Boolean)
                            .map((n) => n[0])
                            .join('')
                            .slice(0, 2)
                            .toUpperCase() || '?';
                          const bmi = calcBMI(customer.heightCm, customer.weightKg);
                          const bmiCat = getBMICategory(bmi);

                          return (
                            <tr key={customer._id} className="hover:bg-brand-50/10 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-4">
                                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-brand-100 to-brand-200 text-brand-700 flex items-center justify-center font-display font-extrabold text-sm border border-brand-200/50 shadow-inner-sm shrink-0">
                                    {initials}
                                  </div>
                                  <div>
                                    <p className="font-display font-bold text-gray-900 text-[15px]">{customer.name}</p>
                                    <p className="text-xs text-muted font-mono font-semibold">{customer.phone}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-bold rounded-lg border border-border">
                                  {customer.batchId?.name || 'No Batch (Individual)'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="space-y-0.5">
                                  <p className="text-sm font-semibold text-gray-800">
                                    {customer.age ? `${customer.age} years old` : '—'}
                                  </p>
                                  <p className="text-xs text-muted font-bold capitalize">
                                    {customer.gender || '—'}
                                  </p>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {customer.heightCm || customer.weightKg ? (
                                  <div className="flex items-center gap-4">
                                    <div className="space-y-0.5 text-xs font-semibold text-gray-700">
                                      <p>{customer.heightCm ? `${customer.heightCm} cm` : '—'} ht</p>
                                      <p>{customer.weightKg ? `${customer.weightKg} kg` : '—'} wt</p>
                                    </div>
                                    {bmi && (
                                      <div className={`px-2.5 py-1 rounded-xl border ${bmiCat.color} ${bmiCat.bg} border-current/20 flex flex-col items-center justify-center shrink-0`}>
                                        <span className="font-mono font-extrabold text-sm leading-none">{bmi.toFixed(1)}</span>
                                        <span className="text-[8px] font-black uppercase tracking-wider mt-0.5">{bmiCat.label}</span>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-xs text-muted font-medium">—</span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="space-y-1 text-xs">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted w-12">Joined:</span>
                                    <span className="font-semibold text-gray-900">
                                      {customer.joinedDate || customer.createdAt ? new Date(customer.joinedDate || customer.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-500 w-12">Starts:</span>
                                    <span className="font-semibold text-brand-600">
                                      {customer.startDate ? new Date(customer.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                                <button
                                  onClick={() => openTaskViewer(customer)}
                                  className="px-3 py-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100/70 rounded-xl transition-colors inline-flex items-center gap-1 border border-emerald-200/50"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                  </svg>
                                  Tasks
                                </button>
                                <button
                                  onClick={() => openEditModal(customer)}
                                  className="px-3 py-1.5 text-xs font-bold text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100/70 rounded-xl transition-colors inline-flex items-center gap-1 border border-brand-200/50"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteCustomer(customer)}
                                  className="px-3 py-1.5 text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100/70 rounded-xl transition-colors inline-flex items-center gap-1 border border-red-200/50"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                  Delete
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        ) : (
          <>
            {/* Batches Actions Bar */}
            <section className="flex items-center justify-between mb-6">
              <h2 className="font-display font-extrabold text-base text-gray-900">Batches & Challenge Groups</h2>
              <button
                onClick={() => {
                  setEditingBatch(null);
                  setBatchFormData({
                    name: '',
                    startDate: new Date().toISOString().split('T')[0],
                  });
                  setIsBatchModalOpen(true);
                }}
                className="btn-brand sm:w-auto px-6 py-3 rounded-2xl flex items-center justify-center gap-2 text-sm shadow-brand hover:scale-[1.01]"
                style={{ minHeight: '46px' }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                </svg>
                Create Batch / Class
              </button>
            </section>

            {/* Batches Grid */}
            {batches.length === 0 ? (
              <div className="bg-white rounded-3xl border border-border shadow-sm p-12 text-center flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-500 mb-4 border border-brand-100">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="font-display font-bold text-gray-900 mb-1">No batches found</h3>
                <p className="text-sm text-gray-500 max-w-xs">Create your first class or batch to start scheduling customer challenges collectively.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {batches.map((batch) => (
                  <div key={batch._id} className="bg-white rounded-3xl border border-border p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="px-3 py-1 bg-brand-50 text-brand-700 text-[11px] font-black rounded-lg border border-brand-100 uppercase tracking-wide">
                          Challenge Group
                        </span>
                        <span className="text-xs text-muted font-bold">
                          {batch.customerCount || 0} active members
                        </span>
                      </div>
                      <h3 className="font-display font-bold text-gray-900 text-lg mb-1">{batch.name}</h3>
                      <div className="flex items-center gap-1.5 text-xs text-muted font-semibold mt-3">
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Start Date: {new Date(batch.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>
                    <div className="mt-6 pt-4 border-t border-border flex justify-between items-center">
                      <button
                        onClick={() => {
                          setEditingBatch(batch);
                          setBatchFormData({
                            name: batch.name,
                            startDate: new Date(batch.startDate).toISOString().split('T')[0],
                          });
                          setIsBatchModalOpen(true);
                        }}
                        className="text-xs font-bold text-gray-500 hover:text-gray-700 transition-colors inline-flex items-center gap-1"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          setSelectedBatchFilter(batch._id);
                          setActiveTab('customers');
                        }}
                        className="text-xs font-bold text-brand-600 hover:text-brand-700 transition-colors"
                      >
                        View Members &rarr;
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* Creation/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => !formLoading && setIsModalOpen(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
          />

          <div className="bg-white w-full max-w-lg rounded-[2.5rem] border border-border shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh] animate-scale-in">
            {/* Header */}
            <div className="px-6 py-5 border-b border-border bg-gradient-to-r from-brand-50/50 to-transparent flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-display font-extrabold text-lg text-gray-900">
                  {editingCustomer ? 'Edit Customer' : 'Create New Customer'}
                </h3>
                <p className="text-xs text-muted mt-0.5">
                  {editingCustomer ? 'Update credentials, batch or metrics for the challenge' : 'Register a customer profile for the challenge'}
                </p>
              </div>
              <button
                disabled={formLoading}
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200/80 flex items-center justify-center text-gray-500 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Form Scroll Body */}
            <form onSubmit={handleSubmitForm} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {formError && (
                <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 rounded-2xl p-3 text-xs text-red-700">
                  <svg className="w-4 h-4 shrink-0 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span className="font-bold">{formError}</span>
                </div>
              )}

              {/* Basic Details */}
              <div className="space-y-3">
                <p className="text-[10px] font-extrabold text-brand-600 uppercase tracking-widest px-1">Account Credentials</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 px-1">Full Name *</label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="e.g. Martha Stewart"
                      className="w-full rounded-2xl border border-border bg-[#FAFAFA] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-500 transition-all text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 px-1">Phone Number *</label>
                    <input
                      type="tel"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="e.g. 9876543210"
                      className="w-full rounded-2xl border border-border bg-[#FAFAFA] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-500 transition-all text-gray-900"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 px-1">
                    {editingCustomer ? 'Password (leave blank to keep unchanged)' : 'Password *'}
                  </label>
                  <input
                    type="password"
                    name="password"
                    required={!editingCustomer}
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder={editingCustomer ? "••••••••" : "Enter account password"}
                    className="w-full rounded-2xl border border-border bg-[#FAFAFA] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-500 transition-all text-gray-900"
                  />
                </div>
              </div>

              <hr className="border-border my-2" />

              {/* Batch Assignment */}
              <div className="space-y-3">
                <p className="text-[10px] font-extrabold text-brand-600 uppercase tracking-widest px-1">Batch Assignment</p>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 px-1">Class / Batch</label>
                  <select
                    name="batchId"
                    value={formData.batchId}
                    onChange={handleInputChange}
                    className="w-full rounded-2xl border border-border bg-[#FAFAFA] px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-500 transition-all text-gray-900"
                  >
                    <option value="" disabled>Select a Batch/Class *</option>
                    {batches.map((b) => {
                      const isStarted = new Date(b.startDate) <= new Date();
                      const currentBatchId = editingCustomer?.batchId?._id || editingCustomer?.batchId || '';
                      const isCurrentBatch = currentBatchId && (currentBatchId === b._id);
                      const isOptionDisabled = isStarted && !isCurrentBatch;
                      return (
                        <option key={b._id} value={b._id} disabled={isOptionDisabled}>
                          {b.name} (Starts {new Date(b.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}){isStarted ? ' - Started' : ''}{isOptionDisabled ? ' (Disabled)' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              <hr className="border-border my-2" />

              {/* Bio & Demographics */}
              <div className="space-y-3">
                <p className="text-[10px] font-extrabold text-brand-600 uppercase tracking-widest px-1">Metrics & Demographics</p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 px-1">Age</label>
                    <input
                      type="number"
                      name="age"
                      value={formData.age}
                      onChange={handleInputChange}
                      placeholder="yrs"
                      className="w-full rounded-2xl border border-border bg-[#FAFAFA] px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-500 transition-all text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 px-1">Height (cm)</label>
                    <input
                      type="number"
                      name="heightCm"
                      value={formData.heightCm}
                      onChange={handleInputChange}
                      placeholder="cm"
                      className="w-full rounded-2xl border border-border bg-[#FAFAFA] px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-500 transition-all text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 px-1">Weight (kg)</label>
                    <input
                      type="number"
                      name="weightKg"
                      value={formData.weightKg}
                      onChange={handleInputChange}
                      placeholder="kg"
                      className="w-full rounded-2xl border border-border bg-[#FAFAFA] px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-500 transition-all text-gray-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 px-1">Gender</label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="w-full rounded-2xl border border-border bg-[#FAFAFA] px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-500 transition-all text-gray-900"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 px-1">Start Date (Fallback)</label>
                    <input
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleInputChange}
                      className="w-full rounded-2xl border border-border bg-[#FAFAFA] px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-500 transition-all text-gray-900"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 shrink-0">
                <button
                  type="button"
                  disabled={formLoading}
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3.5 rounded-2xl font-bold text-sm text-gray-700 bg-gray-100 hover:bg-gray-200/80 active:scale-[0.98] transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 btn-brand py-3.5 rounded-2xl font-bold text-sm text-white shadow-brand hover:scale-[1.01]"
                  style={{ minHeight: '48px' }}
                >
                  {formLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      {editingCustomer ? 'Saving…' : 'Creating…'}
                    </span>
                  ) : (
                    editingCustomer ? 'Save Changes' : 'Add Member'
                  )}
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
            onClick={() => {
              if (!batchFormLoading) {
                setIsBatchModalOpen(false);
                setEditingBatch(null);
              }
            }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
          />

          <div className="bg-white w-full max-w-md rounded-[2.5rem] border border-border shadow-2xl relative overflow-hidden flex flex-col animate-scale-in">
            <div className="px-6 py-5 border-b border-border bg-gradient-to-r from-brand-50/50 to-transparent flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-display font-extrabold text-lg text-gray-900">
                  {editingBatch ? 'Edit Batch / Class' : 'Create Batch / Class'}
                </h3>
                <p className="text-xs text-muted mt-0.5">
                  {editingBatch ? 'Update name and challenge starting date for this group' : 'Define a group and its 30-day challenge starting date'}
                </p>
              </div>
              <button
                disabled={batchFormLoading}
                onClick={() => {
                  setIsBatchModalOpen(false);
                  setEditingBatch(null);
                }}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200/80 flex items-center justify-center text-gray-500 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSaveBatch} className="px-6 py-5 space-y-4">
              {batchFormError && (
                <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 rounded-2xl p-3 text-xs text-red-700">
                  <svg className="w-4 h-4 shrink-0 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span className="font-bold">{batchFormError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 px-1">Batch / Class Name *</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={batchFormData.name}
                  onChange={handleBatchInputChange}
                  placeholder="e.g. Batch of July 2026"
                  className="w-full rounded-2xl border border-border bg-[#FAFAFA] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-500 transition-all text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 px-1">Challenge Start Date *</label>
                <input
                  type="date"
                  name="startDate"
                  required
                  value={batchFormData.startDate}
                  onChange={handleBatchInputChange}
                  className="w-full rounded-2xl border border-border bg-[#FAFAFA] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-500 transition-all text-gray-900"
                />
              </div>

              <div className="flex gap-3 pt-4 shrink-0">
                <button
                  type="button"
                  disabled={batchFormLoading}
                  onClick={() => {
                    setIsBatchModalOpen(false);
                    setEditingBatch(null);
                  }}
                  className="flex-1 py-3.5 rounded-2xl font-bold text-sm text-gray-700 bg-gray-100 hover:bg-gray-200/80 active:scale-[0.98] transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={batchFormLoading}
                  className="flex-1 btn-brand py-3.5 rounded-2xl font-bold text-sm text-white shadow-brand hover:scale-[1.01]"
                  style={{ minHeight: '48px' }}
                >
                  {batchFormLoading ? (editingBatch ? 'Saving…' : 'Creating…') : (editingBatch ? 'Save Changes' : 'Create Batch')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer 30-Day Task Log Modal */}
      {taskViewerCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setTaskViewerCustomer(null)}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
          />

          <div className="bg-white w-full max-w-5xl h-[85vh] rounded-[2.5rem] border border-border shadow-2xl relative overflow-hidden flex flex-col animate-scale-in">
            {/* Header */}
            <div className="px-6 py-5 border-b border-border bg-gradient-to-r from-brand-50/50 to-transparent flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-display font-extrabold text-lg text-gray-900">
                  {taskViewerCustomer.name}'s Challenge Progress
                </h3>
                <p className="text-xs text-muted mt-0.5">
                  View and edit daily tasks logs across the 30-day timeline.
                </p>
              </div>
              <button
                onClick={() => setTaskViewerCustomer(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200/80 flex items-center justify-center text-gray-500 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body: Two-panel layout */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              
              {/* Left Panel: 30 Days Grid */}
              <div className="w-full md:w-3/5 p-6 overflow-y-auto border-b md:border-b-0 md:border-r border-border">
                <p className="text-xs font-black uppercase text-muted tracking-widest mb-4">30 Days timeline</p>
                {tasksLoading ? (
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                    {Array.from({ length: 30 }).map((_, idx) => (
                      <div key={idx} className="h-16 rounded-2xl skeleton" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                    {Array.from({ length: 30 }).map((_, idx) => {
                      const dayNum = idx + 1;
                      const dayLogs = customerTasks.filter((l) => l.dayNumber === dayNum);
                      const completedCount = dayLogs.filter((l) => l.completed).length;
                      
                      // Identify completion status
                      const REQUIRED = ['yoga', 'meditation', 'water', 'protein'];
                      const isComplete = REQUIRED.every(t => dayLogs.some(l => l.taskId === t && l.completed));
                      const isPartial = !isComplete && dayLogs.some(l => l.completed);

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
                          <span className="text-[10px] font-bold mt-1.5 opacity-80">{completedCount}/5 done</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right Panel: Selected Day details & toggles */}
              <div className="w-full md:w-2/5 p-6 overflow-y-auto bg-gray-50/50 flex flex-col">
                <p className="text-xs font-black uppercase text-muted tracking-widest mb-4">Task Details</p>

                {selectedTaskDay ? (
                  <div className="space-y-5">
                    <div className="bg-white border border-border p-4 rounded-2xl shadow-sm">
                      <h4 className="font-display font-extrabold text-gray-900 text-base">Day {selectedTaskDay} Details</h4>
                      <p className="text-xs text-muted mt-0.5">Update progress values directly. Saves automatically on blur/toggle.</p>
                    </div>

                    <div className="space-y-3">
                      {['yoga', 'meditation', 'water', 'protein', 'sleep'].map((taskId) => {
                        const isRequired = taskId !== 'sleep';
                        const log = customerTasks.find(l => l.dayNumber === selectedTaskDay && l.taskId === taskId) || { completed: false, amount: 0 };
                        
                        const titles = {
                          yoga: 'Yoga (Minutes)',
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
                              <span className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                {titles[taskId]}
                                {isRequired && (
                                  <span className="px-1.5 py-0.5 bg-red-50 text-red-600 text-[9px] font-black uppercase rounded">Required</span>
                                )}
                              </span>
                              <input
                                type="checkbox"
                                checked={log.completed}
                                onChange={(e) => handleUpdateTaskLog(selectedTaskDay, taskId, e.target.checked, log.amount)}
                                className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-gray-300"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                placeholder={`Amount in ${unit}`}
                                value={log.amount || ''}
                                onBlur={(e) => handleUpdateTaskLog(selectedTaskDay, taskId, log.completed, Number(e.target.value))}
                                onChange={(e) => {
                                  // Update local state without saving immediately for responsiveness
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
                    <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 mb-3 border border-border">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                      </svg>
                    </div>
                    <p className="text-sm font-bold text-gray-800">No day selected</p>
                    <p className="text-xs text-gray-400 mt-1 max-w-xs">Click on any day in the timeline grid on the left to edit task details.</p>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
