import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './Dashboard.css';

const OverviewChart = ({ appointments = [] }) => {
  const [filter, setFilter] = useState('This Week');

  const processChartData = () => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    const parseDate = (dateStr) => {
      if (!dateStr) return null;
      const parts = String(dateStr).split('/');
      if (parts.length === 3) return new Date(parts[2], parts[1] - 1, parts[0]);
      return new Date(dateStr);
    };

    if (filter === 'This Year') {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const data = months.map(m => ({ name: m, value: 0 }));
      appointments.forEach(a => {
        const d = parseDate(a.appointment_date);
        if (d && !isNaN(d.getTime()) && d.getFullYear() === currentYear) {
          data[d.getMonth()].value += 1;
        }
      });
      return data;
    } 
    
    if (filter === 'This Month') {
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      const data = Array.from({ length: daysInMonth }, (_, i) => ({ name: String(i + 1), value: 0 }));
      appointments.forEach(a => {
        const d = parseDate(a.appointment_date);
        if (d && !isNaN(d.getTime()) && d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
          data[d.getDate() - 1].value += 1;
        }
      });
      return data;
    }

    // Default: 'This Week'
    const currentDayOfWeek = today.getDay(); 
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - currentDayOfWeek + (currentDayOfWeek === 0 ? -6 : 1)); 
    startOfWeek.setHours(0,0,0,0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23,59,59,999);

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weekData = { 'Mon': 0, 'Tue': 0, 'Wed': 0, 'Thu': 0, 'Fri': 0, 'Sat': 0, 'Sun': 0 };
    appointments.forEach(a => {
      const d = parseDate(a.appointment_date);
      if (d && !isNaN(d.getTime()) && d >= startOfWeek && d <= endOfWeek) {
        weekData[dayNames[d.getDay()]] += 1;
      }
    });

    return [
      { name: 'Mon', value: weekData['Mon'] },
      { name: 'Tue', value: weekData['Tue'] },
      { name: 'Wed', value: weekData['Wed'] },
      { name: 'Thu', value: weekData['Thu'] },
      { name: 'Fri', value: weekData['Fri'] },
      { name: 'Sat', value: weekData['Sat'] },
      { name: 'Sun', value: weekData['Sun'] }
    ];
  };

  const data = processChartData();

  return (
    <div className="chart-card overview-chart">
      <div className="chart-header">
        <h3>Appointments Overview</h3>
        <select className="chart-dropdown" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="This Week">This Week</option>
          <option value="This Month">This Month</option>
          <option value="This Year">This Year</option>
        </select>
      </div>
      <div className="chart-body" style={{ height: '300px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
              itemStyle={{ color: '#1f2937', fontWeight: 'bold' }}
            />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke="#6366f1" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorValue)" 
              activeDot={{ r: 6, strokeWidth: 0, fill: '#6366f1' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default OverviewChart;
