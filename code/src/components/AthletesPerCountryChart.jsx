import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import Papa from 'papaparse';
import '../styles.css'; // Import global styles for CSS variables
import './css/AthletesPerCountryChart.css';

// Get Olympic theme colors from CSS variables
const getThemeColors = () => {
  const isDarkTheme = document.documentElement.getAttribute('data-theme') === 'dark';
  
  // Define default color values that match the CSS
  const defaultColors = {
    bronze: '#CD7F32',
    silver: '#C0C0C0', 
    gold: '#D4AF37',
    textPrimary: isDarkTheme ? '#f2ebdc' : '#2E2E2E',
    gridColor: isDarkTheme ? '#444444' : '#E0E0E0'
  };
  
  // Try to get colors from CSS variables, but use defaults if not available
  const getColorVariable = (variableName, fallback) => {
    try {
      if (typeof window === 'undefined' || !document.documentElement) {
        return fallback;
      }
      
      const computed = getComputedStyle(document.documentElement);
      const value = computed.getPropertyValue(variableName).trim();
      
      // Check if we got a valid color value
      if (value && value !== '' && value !== 'undefined' && !value.includes('undefined')) {
        return value;
      }
      
      return fallback;
    } catch (error) {
      return fallback;
    }
  };
  
  // Get colors with robust fallbacks
  const bronze = getColorVariable('--bronze', defaultColors.bronze);
  const silver = getColorVariable('--silver', defaultColors.silver);
  const gold = getColorVariable('--gold', defaultColors.gold);
  const textColor = getColorVariable('--text-primary', defaultColors.textPrimary);
  
  // Convert hex to RGB for interpolation
  const getRgbFromHex = (hex) => {
    // Remove any whitespace and ensure we have a valid hex
    const cleanHex = hex.replace(/\s/g, '');
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(cleanHex);
    
    if (result) {
      return [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
      ];
    }
    
    // If hex parsing fails, return default silver RGB
    return [192, 192, 192];
  };
  
  return {
    bronze: getRgbFromHex(bronze),
    silver: getRgbFromHex(silver),
    gold: getRgbFromHex(gold),
    textColor,
    gridColor: defaultColors.gridColor
  };
};

const interpolateColor = (value, min, max) => {
  const { bronze, silver, gold } = getThemeColors();
  
  // Ensure we have valid min/max values
  if (max === min) {
    return `rgb(${silver[0]}, ${silver[1]}, ${silver[2]})`;
  }
  
  const ratio = Math.max(0, Math.min(1, (value - min) / (max - min)));
  let color;

  if (ratio < 0.5) {
    // Bronze → Silver
    const r = bronze.map((b, i) => Math.round(b + (silver[i] - b) * (ratio * 2)));
    color = `rgb(${r[0]}, ${r[1]}, ${r[2]})`;
  } else {
    // Silver → Gold
    const r = silver.map((s, i) => Math.round(s + (gold[i] - s) * ((ratio - 0.5) * 2)));
    color = `rgb(${r[0]}, ${r[1]}, ${r[2]})`;
  }

  return color;
};

const AthletesPerCountryChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(document.documentElement.getAttribute('data-theme') === 'dark');
  const [stylesLoaded, setStylesLoaded] = useState(false);
  
  // Check if styles are loaded
  useEffect(() => {
    let mounted = true;
    
    const checkStylesLoaded = () => {
      if (!mounted) return;
      
      try {
        const testColor = getComputedStyle(document.documentElement).getPropertyValue('--silver').trim();
        const hasValidColor = testColor && testColor !== '' && !testColor.includes('undefined');
        
        if (hasValidColor) {
          setStylesLoaded(true);
        } else {
          // Retry after a short delay
          setTimeout(() => {
            if (mounted) {
              checkStylesLoaded();
            }
          }, 50);
        }
      } catch (error) {
        // If we can't access styles, just set as loaded to use fallbacks
        setStylesLoaded(true);
      }
    };
    
    // Initial check
    checkStylesLoaded();
    
    // Also check when document is fully loaded
    if (document.readyState === 'loading') {
      const handleDOMLoaded = () => checkStylesLoaded();
      document.addEventListener('DOMContentLoaded', handleDOMLoaded);
      
      return () => {
        mounted = false;
        document.removeEventListener('DOMContentLoaded', handleDOMLoaded);
      };
    }
    
    return () => {
      mounted = false;
    };
  }, []);
  
  // Get fresh colors on each render to handle theme changes and style loading
  const colors = getThemeColors();

  // Monitor theme changes
  useEffect(() => {
    const handleThemeChange = () => {
      setIsDarkMode(document.documentElement.getAttribute('data-theme') === 'dark');
      // Force re-render of colors when theme changes
      setStylesLoaded(true);
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/bios.csv');
        const csvText = await response.text();

        Papa.parse(csvText, {
          header: true,
          complete: (results) => {
            const athletes = results.data;
            const countryCounts = {};

            athletes.forEach(athlete => {
              if (athlete.born_country) {
                const country = athlete.born_country;
                countryCounts[country] = (countryCounts[country] || 0) + 1;
              }
            });

            const chartData = Object.keys(countryCounts).map(country => ({
              country,
              count: countryCounts[country]
            }));

            chartData.sort((a, b) => b.count - a.count);
            setData(chartData);
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

  const handleScroll = (e) => {
    e.stopPropagation();
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="country-name">{label}</p>
          <p className="athlete-count">{`${payload[0].value.toLocaleString()} athletes`}</p>
        </div>
      );
    }
    return null;
  };

  const customLegendFormatter = (value, entry) => {
    return <span style={{ color: `rgb(${colors.gold[0]}, ${colors.gold[1]}, ${colors.gold[2]})` }}>{value}</span>;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading Olympic athletes data...</p>
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

  const chartHeight = Math.max(500, data.length * 25);
  const min = Math.min(...data.map(d => d.count));
  const max = Math.max(...data.map(d => d.count));

  return (
    <div className="athletes-chart-container">
      <h2 className="chart-title">Olympic Athletes by Country</h2>

      <div className="chart-wrapper">
        <div
          className="chart-scrollable-container"
          onWheel={handleScroll}
          onTouchMove={handleScroll}
        >
          <div className="chart-inner-container" style={{ height: `${chartHeight}px` }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                layout="vertical"
                margin={{
                  top: 20,
                  right: 60,
                  left: 80,
                  bottom: 5,
                }}
                style={{outline: 'none', border: 'none'}}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={colors.gridColor} />
                <XAxis
                  type="number"
                  tick={{ fill: colors.textColor, fontSize: 12 }}
                  tickLine={{ stroke: colors.gridColor }}
                  axisLine={{ stroke: colors.gridColor }}
                  domain={[0, 'dataMax + 100']}
                />
                <YAxis
                  dataKey="country"
                  type="category"
                  width={70}
                  tick={{ fill: colors.textColor, fontSize: 12 }}
                  tickLine={{ stroke: colors.gridColor }}
                  axisLine={{ stroke: colors.gridColor }}
                />
                <Tooltip 
                  content={<CustomTooltip />} 
                  cursor={{fill: 'rgba(60, 60, 60, 0.6)', stroke: 'transparent'}}  
                  wrapperStyle={{outline: 'none'}}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: '15px' }} 
                  formatter={customLegendFormatter}
                  iconType="rect"
                  payload={[{
                    value: 'Cumulative Number of Athletes',
                    type: 'rect',
                    color: `rgb(${colors.gold[0]}, ${colors.gold[1]}, ${colors.gold[2]})`
                  }]}
                />
                <Bar
                  dataKey="count"
                  name="Cumulative Number of Athletes"
                  radius={[0, 4, 4, 0]}
                  animationDuration={1500}
                  activeBar={{fill: 'rgba(50, 50, 50, 0.5)', stroke: 'transparent'}}
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={interpolateColor(entry.count, min, max)}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="chart-footer">
      </div>
    </div>
  );
};

export default AthletesPerCountryChart;