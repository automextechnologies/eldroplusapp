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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
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
  });

  useEffect(() => {
    fetchCustomers();
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

  async function handleLogout() {
    logout();
    navigate('/login');
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const openCreateModal = () => {
    setFormData({
      name: '',
      phone: '',
      password: '',
      age: '',
      gender: 'male',
      heightCm: '',
      weightKg: '',
      startDate: new Date().toISOString().split('T')[0],
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);

    // Basic Validation
    if (!formData.name.trim()) { setFormError('Name is required'); setFormLoading(false); return; }
    if (!formData.phone.trim()) { setFormError('Phone number is required'); setFormLoading(false); return; }
    if (!formData.password.trim()) { setFormError('Password is required'); setFormLoading(false); return; }

    try {
      const payload = {
        ...formData,
        age: formData.age ? Number(formData.age) : undefined,
        heightCm: formData.heightCm ? Number(formData.heightCm) : undefined,
        weightKg: formData.weightKg ? Number(formData.weightKg) : undefined,
      };

      const res = await api.post('/api/admin/customers', payload);
      setCustomers((prev) => [res.customer, ...prev]);
      setIsModalOpen(false);
      setSuccessMsg(`Customer "${res.customer.name}" created successfully!`);
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      setFormError(err.message || 'Failed to create customer');
    } finally {
      setFormLoading(false);
    }
  };

  // Stats Calculations
  const totalCount = customers.length;
  const avgAge = totalCount
    ? Math.round(customers.reduce((acc, c) => acc + (c.age || 0), 0) / customers.filter((c) => c.age).length || 0)
    : 0;
  const avgWeight = totalCount
    ? Math.round((customers.reduce((acc, c) => acc + (c.weightKg || 0), 0) / customers.filter((c) => c.weightKg).length || 0) * 10) / 10
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
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery)
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

        {/* Overview Dashboard Stats */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          {[
            {
              label: 'Total Customers',
              value: totalCount,
              desc: 'Registered users',
              color: 'from-brand-50 to-brand-100/50 border-brand-200 text-brand-700',
              icon: (
                <svg className="w-6 h-6 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              ),
            },
            {
              label: 'Average Age',
              value: avgAge ? `${avgAge} yrs` : '—',
              desc: 'Target demographic',
              color: 'from-purple-50 to-purple-100/50 border-purple-200 text-purple-700',
              icon: (
                <svg className="w-6 h-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              ),
            },
            {
              label: 'Average Weight',
              value: avgWeight ? `${avgWeight} kg` : '—',
              desc: 'Tracked body stats',
              color: 'from-blue-50 to-blue-100/50 border-blue-200 text-blue-700',
              icon: (
                <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                </svg>
              ),
            },
            {
              label: 'Average BMI',
              value: avgBmi || '—',
              desc: 'Health index health',
              color: 'from-emerald-50 to-emerald-100/50 border-emerald-200 text-emerald-700',
              icon: (
                <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              ),
            },
          ].map((stat, idx) => (
            <div
              key={idx}
              className={`p-5 rounded-3xl border bg-gradient-to-br flex items-center justify-between shadow-sm premium-card`}
            >
              <div className="space-y-1">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{stat.label}</p>
                <p className="text-2xl font-display font-black text-gray-900">{stat.value}</p>
                <p className="text-xs text-muted font-medium">{stat.desc}</p>
              </div>
              <div className={`w-12 h-12 rounded-2xl bg-white flex items-center justify-center border shadow-inner-sm`}>
                {stat.icon}
              </div>
            </div>
          ))}
        </section>

        {/* Search & Actions Bar */}
        <section className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between mb-6">
          <div className="relative flex-1 max-w-md">
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
              {filteredCustomers.length} total
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
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-500 mb-4 border border-brand-100">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="font-display font-bold text-gray-900 mb-1">No customers found</h3>
              <p className="text-sm text-gray-500 max-w-xs">
                {searchQuery ? 'Adjust your search queries to see more entries.' : 'Add your first customer by clicking the button above.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-gradient-to-r from-brand-50/40 to-transparent border-b border-border">
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Details</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Body Stats & BMI</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Joined Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredCustomers.map((customer) => {
                    const initials = customer.name
                      ?.split(' ')
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
                          <p className="text-sm font-semibold text-gray-900">
                            {customer.startDate ? new Date(customer.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                          </p>
                          <p className="text-[10px] text-brand-500 font-bold uppercase tracking-wider mt-0.5">
                            Active Challenge
                          </p>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {/* Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            onClick={() => !formLoading && setIsModalOpen(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
          />

          {/* Modal Content */}
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] border border-border shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh] animate-scale-in">
            {/* Header */}
            <div className="px-6 py-5 border-b border-border bg-gradient-to-r from-brand-50/50 to-transparent flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-display font-extrabold text-lg text-gray-900">Create New Customer</h3>
                <p className="text-xs text-muted mt-0.5">Register a customer profile for the 30-day challenge</p>
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
            <form onSubmit={handleCreateCustomer} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
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
                  <label className="block text-xs font-bold text-gray-700 mb-1 px-1">Password *</label>
                  <input
                    type="password"
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter account password"
                    className="w-full rounded-2xl border border-border bg-[#FAFAFA] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-500 transition-all text-gray-900"
                  />
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
                    <label className="block text-xs font-bold text-gray-700 mb-1 px-1">Start Date</label>
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
                      Creating…
                    </span>
                  ) : (
                    'Add Member'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
