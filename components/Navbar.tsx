
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar: React.FC = () => {
  const location = useLocation();

  return (
    <nav className="cricket-gradient shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <div className="bg-white p-1.5 rounded-full">
               <svg className="w-6 h-6 text-blue-800" fill="currentColor" viewBox="0 0 24 24">
                 <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71L12 2z" />
               </svg>
            </div>
            <span className="text-white font-bold text-xl tracking-tight">AuctionPro</span>
          </Link>
          
          <div className="hidden md:flex space-x-8">
            <Link 
              to="/" 
              className={`text-sm font-medium transition-colors ${location.pathname === '/' ? 'text-white' : 'text-blue-100 hover:text-white'}`}
            >
              Home
            </Link>
            <Link 
              to="/admin" 
              className={`text-sm font-medium transition-colors ${location.pathname.startsWith('/admin') ? 'text-white' : 'text-blue-100 hover:text-white'}`}
            >
              Admin Setup
            </Link>
          </div>

          <div className="flex md:hidden">
            {/* Simple Mobile Toggle Placeholder */}
             <button className="text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                </svg>
             </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
