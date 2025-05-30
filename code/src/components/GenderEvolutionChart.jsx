// src/components/GenderEvolutionChart.jsx
import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, ComposedChart, Area, Line
} from 'recharts';
import Papa from 'papaparse';
import './css/GenderEvolutionChart.css';

const GenderEvolutionChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartType, setChartType] = useState('bar'); // 'bar' or 'proportion'
  const [isDarkMode, setIsDarkMode] = useState(document.documentElement.getAttribute('data-theme') === 'dark');

  // Get Olympic theme colors
  useEffect(() => {
    // Update theme on changes
    const handleThemeChange = () => {
      setIsDarkMode(document.documentElement.getAttribute('data-theme') === 'dark');
    };
    
    // Use MutationObserver to detect theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-theme') {
          handleThemeChange();
        }
      });
    });
    
    observer.observe(document.documentElement, { attributes: true });
    
    return () => {
      observer.disconnect();
    };
  }, []);

  // Get theme colors
  const colors = {
    female: getComputedStyle(document.documentElement).getPropertyValue('--gold').trim() || '#D4AF37',
    male: getComputedStyle(document.documentElement).getPropertyValue('--silver').trim() || '#C0C0C0',
    femaleLine: getComputedStyle(document.documentElement).getPropertyValue('--bronze').trim() || '#CD7F32',
    text: getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim() || '#2E2E2E',
    grid: isDarkMode ? '#444444' : '#E0E0E0'
  };

  useEffect(() => {
    // Function to fetch and process the CSV file
    const fetchData = async () => {
      try {
        // Fetch the CSV file
        const response = await fetch('/mw_per_year.csv');
        const csvText = await response.text();
        
        // Parse the CSV
        Papa.parse(csvText, {
          header: true,
          dynamicTyping: true, // Automatically convert numeric values
          complete: (results) => {
            // Process the data for the chart
            const processedData = results.data
              .filter(row => row.year && row.Female !== undefined && row.Male !== undefined)
              .map(row => ({
                year: row.year,
                Female: row.Female,
                Male: row.Male,
                total: row.Female + row.Male,
                femaleRatio: (row.Female / (row.Female + row.Male)) * 100,
                maleRatio: (row.Male / (row.Female + row.Male)) * 100
              }));
            
            setData(processedData);
            setLoading(false);
          },
          error: (error) => {
            setError(error.message);
            setLoading(false);
          }
        });
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Custom tooltip for numbers chart
  const NumbersTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="year">{`Year: ${label}`}</p>
          <p style={{ color: colors.female }}>
            {`Women: ${payload[0].value.toLocaleString()}`}
          </p>
          <p style={{ color: colors.male }}>
            {`Men: ${payload[1].value.toLocaleString()}`}
          </p>
          <p style={{ color: colors.text }}>
            {`Total: ${(payload[0].value + payload[1].value).toLocaleString()}`}
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for proportion chart
  const ProportionTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="year">{`Year: ${label}`}</p>
          <p style={{ color: colors.female }}>
            {`Women: ${payload[0].value.toFixed(1)}%`}
          </p>
          <p style={{ color: colors.male }}>
            {`Men: ${(100 - payload[0].value).toFixed(1)}%`}
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading gender evolution data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p>Error loading data: {error}</p>
      </div>
    );
  }

  return (
    <div className="gender-evolution-container">
      <h2 className="chart-title">Gender Evolution in Olympic Games</h2>
      
      <div className="chart-controls">
        <button 
          className={`chart-button ${chartType === 'bar' ? 'active' : ''}`}
          onClick={() => setChartType('bar')}
        >
          Participants Count
        </button>
        <button 
          className={`chart-button ${chartType === 'proportion' ? 'active' : ''}`}
          onClick={() => setChartType('proportion')}
        >
          Gender Proportion
        </button>
      </div>
      
      <div className="chart-container">
        {chartType === 'bar' && (
          <ResponsiveContainer width="100%" height={500}>
            <BarChart
              data={data}
              margin={{
                top: 20, right: 30, left: 30, bottom: 20,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
              <XAxis 
                dataKey="year" 
                tick={{ fill: colors.text }}
                tickLine={{ stroke: colors.grid }}
                axisLine={{ stroke: colors.grid }}
              />
              <YAxis 
                tick={{ fill: colors.text }}
                tickLine={{ stroke: colors.grid }}
                axisLine={{ stroke: colors.grid }}
                tickFormatter={(value) => `${Number(value).toFixed(0)}`}
                domain={[0, 'dataMax']}
                tickCount={10}
                allowDecimals={false}
                />
              <Tooltip content={<NumbersTooltip />} />
              <Legend wrapperStyle={{ color: colors.text }} />
              <Bar dataKey="Female" stackId="a" fill={colors.female} name="Women" />
              <Bar dataKey="Male" stackId="a" fill={colors.male} name="Men" />
            </BarChart>
          </ResponsiveContainer>
        )}
        
        {chartType === 'proportion' && (
          <ResponsiveContainer width="100%" height={500}>
            <ComposedChart
              data={data}
              margin={{
                top: 20, right: 30, left: 30, bottom: 20,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
              <XAxis 
                dataKey="year" 
                tick={{ fill: colors.text }}
                tickLine={{ stroke: colors.grid }}
                axisLine={{ stroke: colors.grid }}
              />
              <YAxis 
                tick={{ fill: colors.text }}
                tickLine={{ stroke: colors.grid }}
                axisLine={{ stroke: colors.grid }}
                tickFormatter={(value) => `${Number(value).toFixed(0)}%`}
                domain={[0, 'dataMax']}
                tickCount={6}
                allowDecimals={false}
              />
              <Tooltip content={<ProportionTooltip />} />
              <Legend wrapperStyle={{ color: colors.text }} />
              <Area 
                type="monotone" 
                dataKey="femaleRatio" 
                stackId="1"
                fill={colors.female}
                stroke={colors.female}
                fillOpacity={0.6}
                name="Women %" 
              />
              <Area 
                type="monotone" 
                dataKey="maleRatio" 
                stackId="1"
                fill={colors.male}
                stroke={colors.male}
                fillOpacity={0.6}
                name="Men %" 
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
      
      {/* <div className="chart-observations">
        <h3>Key Observations</h3>
        {data.length > 0 && (
          <ul>
            <li>
              First recorded participation: <strong style={{ color: colors.female }}>{data[0].year}</strong> with 
              <strong style={{ color: colors.female }}> {data[0].Female} women</strong> and <strong style={{ color: colors.male }}>{data[0].Male} men</strong>
            </li>
            <li>
              Most recent data: <strong style={{ color: colors.female }}>{data[data.length-1].year}</strong> with 
              <strong style={{ color: colors.female }}> {data[data.length-1].Female} women</strong> and <strong style={{ color: colors.male }}>{data[data.length-1].Male} men</strong>
            </li>
            <li>
              Gender parity progress: from <strong style={{ color: colors.female }}>{data[0].femaleRatio.toFixed(1)}%</strong> women in {data[0].year} to 
              <strong style={{ color: colors.female }}> {data[data.length-1].femaleRatio.toFixed(1)}%</strong> in {data[data.length-1].year}
            </li>
          </ul>
        )}
      </div> */}
    </div>
  );
};

export default GenderEvolutionChart;