import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import './Dashboard.css';

const CustomPieLabel = ({ cx, cy, total }) => (
  <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central">
    <tspan x={cx} dy="-0.5em" fontSize="24" fontWeight="bold" fill="#1f2937">{total}</tspan>
    <tspan x={cx} dy="1.5em" fontSize="14" fill="#6b7280">Total</tspan>
  </text>
);

const StatusChart = ({ data, total }) => {
  return (
    <div className="chart-card status-chart">
      <div className="chart-header">
        <h3>Appointment Status</h3>
      </div>
      <div className="chart-body" style={{ height: '300px', display: 'flex' }}>
        <div className="donut-container" style={{ width: '50%', height: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <CustomPieLabel cx="50%" cy="50%" total={total} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div className="donut-legend">
          {data.map((item, index) => (
            <div className="legend-item" key={index}>
              <div className="legend-label">
                <span className="legend-dot" style={{ backgroundColor: item.color }}></span>
                <span className="legend-name">{item.name}</span>
              </div>
              <div className="legend-stats">
                <span className="legend-value">{item.value}</span>
                <span className="legend-percent">({item.percentage})</span>
              </div>
            </div>
          ))}
        </div>
        <div className="view-full-report">
          <a href="#">View full report →</a>
        </div>
      </div>
    </div>
  );
};

export default StatusChart;
