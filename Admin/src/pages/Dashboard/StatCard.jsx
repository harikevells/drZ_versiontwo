import React from 'react';
import { FaArrowUp, FaArrowDown } from 'react-icons/fa';
import './Dashboard.css';

const StatCard = ({ stat }) => {
  return (
    <div className="stat-card">
      <div className="stat-card-header">
        <div className="stat-icon-wrapper" style={{ backgroundColor: stat.bgColor, color: stat.color }}>
          {stat.icon}
        </div>
        <div className="stat-info">
          <p className="stat-title">{stat.title}</p>
          <h3 className="stat-value">{stat.value}</h3>
          <p className={`stat-percent ${stat.percentType}`}>
            {stat.percentType === 'up' ? <FaArrowUp /> : <FaArrowDown />} {stat.percent} <span className="stat-timeframe">{stat.timeframe}</span>
          </p>
        </div>
      </div>
      <div className="stat-sparkline">
        <svg viewBox="0 0 100 20" preserveAspectRatio="none">
          <path 
            d="M0,15 Q10,5 20,10 T40,15 T60,5 T80,10 T100,5" 
            fill="none" 
            stroke={stat.color} 
            strokeWidth="2" 
            opacity="0.8"
          />
        </svg>
      </div>
    </div>
  );
};

export default StatCard;
