import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Api from '../services/api';

const Header = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const [company, setCompany] = useState({ name: '', logoUrl: '' });

    useEffect(() => {
        const fetchCompany = async () => {
            try {
                const res = await Api.get('/companies');
                if (res.data?.length > 0) {
                    setCompany(res.data[0]);
                }
            } catch (error) {
                console.error('Error fetching company info:', error);
                setCompany(prev => ({ ...prev, businessName: 'Billing System' }));
            }
        };

        fetchCompany();
    }, []);

   const handleLogout = () => {    
        localStorage.removeItem('loggedInUser');
        navigate('/login');

};


    return (
        <nav className="bg-blue-600 w-full ">
            <div className="container mx-auto px-4">
                <div className="relative flex items-center justify-between">
                    {/* Left spacer - removed flex-1 to prevent pushing company name off-center */}
                    <div className="w-0"></div>

                    {/* Centered Company Name */}
                    <div className="absolute left-1/2 transform -translate-x-1/2">
                        <span className="text-white text-base font-bold whitespace-nowrap uppercase tracking-wide">
                            {company.businessName || 'Loading...'}
                        </span>
                    </div>

                    {/* Right-aligned Logout Button - no flex-1 needed */}
                    <div className="ml-auto py-1">
                        {location.pathname !== '/login' && (
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-1 px-2 py-0.5 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-sm "
                            >
                                <span>Logout</span>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Header;