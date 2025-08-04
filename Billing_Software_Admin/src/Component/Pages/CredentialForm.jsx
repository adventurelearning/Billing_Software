import { useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../../service/api';

function CredentialForm({
  showAdminModal: externalShowAdmin = false,
  showUserModal: externalShowUser = false,
  onCloseAdmin: externalCloseAdmin = () => {},
  onCloseUser: externalCloseUser = () => {},
}) {
  const [internalShowAdmin, setInternalShowAdmin] = useState(false);
  const [internalShowUser, setInternalShowUser] = useState(false);

  const isControlled = externalShowAdmin !== undefined || externalShowUser !== undefined;
  const showAdminModal = isControlled ? externalShowAdmin : internalShowAdmin;
  const showUserModal = isControlled ? externalShowUser : internalShowUser;

  const [adminData, setAdminData] = useState({
    username: '',
    contactNumber: '',
    password: '',
    confirmPassword: '',
    showPassword: false,
    showConfirmPassword: false,
  });

  const [userData, setUserData] = useState({
    cashierName: '',
    cashierId: '',
    counterNum: '',
    contactNumber: '',
    password: '',
    confirmPassword: '',
    showPassword: false,
    showConfirmPassword: false,
  });

  const togglePasswordVisibility = (field, isAdmin) => {
    if (isAdmin) {
      setAdminData((prev) => ({ ...prev, [field]: !prev[field] }));
    } else {
      setUserData((prev) => ({ ...prev, [field]: !prev[field] }));
    }
  };

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    if (adminData.password !== adminData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      const response = await api.post('/credentials/admin', adminData);
      toast.success(response.data.message);
      resetAdminForm();
      handleCloseAdmin();
      console.log(response.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error saving admin');
      console.log(error);
    }
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    if (userData.password !== userData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      const response = await api.post('/credentials/users', userData);
      toast.success(response.data.message);
      resetUserForm();
      handleCloseUser();
      console.log(response.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error saving user');
      console.log(error);
    }
  };

  const resetAdminForm = () => {
    setAdminData({
      username: '',
      contactNumber: '',
      password: '',
      confirmPassword: '',
      showPassword: false,
      showConfirmPassword: false,
    });
  };

  const resetUserForm = () => {
    setUserData({
      cashierName: '',
      cashierId: '',
      counterNum: '',
      contactNumber: '',
      password: '',
      confirmPassword: '',
      showPassword: false,
      showConfirmPassword: false,
    });
  };

  const handleCloseAdmin = () => {
    isControlled ? externalCloseAdmin() : setInternalShowAdmin(false);
  };

  const handleCloseUser = () => {
    isControlled ? externalCloseUser() : setInternalShowUser(false);
  };

  return (
    <div>
      {!isControlled && (
        <div className="flex gap-4 mt-6 justify-center">
          <button
            type="button"
            onClick={() => setInternalShowAdmin(true)}
            className="px-6 py-2 bg-blue-700 text-white font-semibold rounded-lg hover:bg-blue-800 shadow-md transition"
          >
            Admin Credentials
          </button>
          <button
            type="button"
            onClick={() => setInternalShowUser(true)}
            className="px-6 py-2 bg-blue-700 text-white font-semibold rounded-lg hover:bg-blue-800 shadow-md transition"
          >
            User Credentials
          </button>
        </div>
      )}

      {(showAdminModal || showUserModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl p-8 animate-fade-in">
            {showAdminModal && (
              <>
                <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">Admin Login</h2>
                <form onSubmit={handleAdminSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[{ id: 'adminUsername', label: 'Username', value: adminData.username, field: 'username' },
                    { id: 'adminContact', label: 'Contact Number', value: adminData.contactNumber, field: 'contactNumber' }
                  ].map(({ id, label, value, field }) => (
                    <div key={id}>
                      <label htmlFor={id} className="block text-gray-600 mb-1">{label}</label>
                      <input
                        type="text"
                        id={id}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        value={value}
                        onChange={(e) => setAdminData({ ...adminData, [field]: e.target.value })}
                        required
                      />
                    </div>
                  ))}

                  {[{ id: 'adminPassword', label: 'Password', field: 'showPassword', key: 'password' },
                    { id: 'adminConfirmPassword', label: 'Confirm Password', field: 'showConfirmPassword', key: 'confirmPassword' }
                  ].map(({ id, label, field, key }) => (
                    <div key={id} className="relative">
                      <label htmlFor={id} className="block text-gray-600 mb-1">{label}</label>
                      <input
                        type={adminData[field] ? 'text' : 'password'}
                        id={id}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg pr-10 focus:ring-2 focus:ring-blue-500"
                        value={adminData[key]}
                        onChange={(e) => setAdminData({ ...adminData, [key]: e.target.value })}
                        required
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-3 top-7 flex items-center"
                        onClick={() => togglePasswordVisibility(field, true)}
                      >
                        {adminData[field] ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                  ))}
                </form>

                <div className="flex justify-end mt-6 gap-4">
                  <button
                    onClick={handleCloseAdmin}
                    className="px-5 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAdminSubmit}
                    className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Save
                  </button>
                </div>
              </>
            )}

            {showUserModal && (
              <>
                <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">User Login</h2>
                <form onSubmit={handleUserSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[{ id: 'cashierName', label: 'Cashier Name', type: 'text' },
                    { id: 'cashierId', label: 'Cashier ID', type: 'number' },
                    { id: 'counterNum', label: 'Counter Number', type: 'text' },
                    { id: 'contactNumber', label: 'Contact Number', type: 'tel' }
                  ].map(({ id, label, type }) => (
                    <div key={id}>
                      <label htmlFor={id} className="block text-gray-600 mb-1">{label}</label>
                      <input
                        type={type}
                        id={id}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        value={userData[id]}
                        onChange={(e) => setUserData({ ...userData, [id]: e.target.value })}
                        required
                      />
                    </div>
                  ))}

                  {[{ id: 'userPassword', label: 'Password', field: 'showPassword', key: 'password' },
                    { id: 'userConfirmPassword', label: 'Confirm Password', field: 'showConfirmPassword', key: 'confirmPassword' }
                  ].map(({ id, label, field, key }) => (
                    <div key={id} className="relative">
                      <label htmlFor={id} className="block text-gray-600 mb-1">{label}</label>
                      <input
                        type={userData[field] ? 'text' : 'password'}
                        id={id}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg pr-10 focus:ring-2 focus:ring-blue-500"
                        value={userData[key]}
                        onChange={(e) => setUserData({ ...userData, [key]: e.target.value })}
                        required
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-3 top-7 flex items-center"
                        onClick={() => togglePasswordVisibility(field, false)}
                      >
                        {userData[field] ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                  ))}
                </form>

                <div className="flex justify-end mt-6 gap-4">
                  <button
                    onClick={handleCloseUser}
                    className="px-5 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUserSubmit}
                    className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Save
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default CredentialForm;
