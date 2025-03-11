import React, { useState, useEffect } from 'react';
import './TimeRangeNavbar.css'; // Import the CSS file

const TimeRangeNavbar = ({ onTimeRangeChange }) => {
  const [activeTab, setActiveTab] = useState('24H');
  const [dateRange, setDateRange] = useState('Mar 02, 2025 - Mar 03, 2025');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());

  // Helper for formatting dates in a nicer way for display
  const formatDisplayDate = (date) => {
    if (!date) return "";
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  // Calculate date range based on selected tab
  useEffect(() => {
    const today = new Date();
    let start = new Date();
    let end = new Date();

    switch (activeTab) {
      case '24H':
        // Last 24 hours
        start = new Date(today);
        start.setDate(today.getDate() - 1);
        end = today;
        break;
      case '7D':
        // Last 7 days
        start = new Date(today);
        start.setDate(today.getDate() - 7);
        end = today;
        break;
      case '1M':
        // Last month
        start = new Date(today);
        start.setMonth(today.getMonth() - 1);
        end = today;
        break;
      case '3M':
        // Last 3 months
        start = new Date(today);
        start.setMonth(today.getMonth() - 3);
        end = today;
        break;
      case 'CUSTOM':
        // Keep custom dates
        break;
      default:
        break;
    }

    setStartDate(start);
    setEndDate(end);
    // Fix: Use template literals properly with backticks
    setDateRange(`${formatDisplayDate(start)} - ${formatDisplayDate(end)}`);

    // Pass data to parent component
    if (onTimeRangeChange) {
      onTimeRangeChange({
        period: activeTab,
        dateRange: activeTab === 'CUSTOM' ? dateRange : '',
        startDate: start,
        endDate: end
      });
    }
  }, [activeTab, onTimeRangeChange]);

  // Handle tab click
  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  return (
    <div className="navbar-container">
      <div className="navbar" style={{ 
        width: activeTab === 'CUSTOM' ? '100%' : 'auto',
        minWidth: '320px', // Ensure it's not too small
        transition: 'width 0.3s ease'
      }}>
        <div className="tabs-container">
          <TabButton 
            label="24H" 
            isActive={activeTab === '24H'} 
            onClick={() => handleTabClick('24H')} 
          />
          <TabButton 
            label="7D" 
            isActive={activeTab === '7D'} 
            onClick={() => handleTabClick('7D')} 
          />
          <TabButton 
            label="1M" 
            isActive={activeTab === '1M'} 
            onClick={() => handleTabClick('1M')} 
          />
          <TabButton 
            label="3M" 
            isActive={activeTab === '3M'} 
            onClick={() => handleTabClick('3M')} 
          />
          <TabButton 
            label="CUSTOM" 
            isActive={activeTab === 'CUSTOM'} 
            onClick={() => handleTabClick('CUSTOM')} 
          />
        </div>
        
        {/* Calendar icon and date range - only shown for CUSTOM */}
        {activeTab === 'CUSTOM' && (
          <div className="date-range">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="16" 
              height="16" 
              fill="currentColor" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
              style={{ marginRight: '8px' }}
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" 
              />
            </svg>
            <span>{dateRange}</span>
          </div>
        )}
      </div>
    </div>
  );
};

// Tab button component
const TabButton = ({ label, isActive, onClick }) => {
  return (
    <button
      // Fix: Use template literals properly with backticks
      className={`tab-button ${isActive ? 'active' : ''}`}
      onClick={onClick}
    >
      {label}
    </button>
  );
};

export default TimeRangeNavbar;