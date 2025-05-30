import React, { useState, useEffect } from 'react';
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';
import Papa from 'papaparse';
import './css/OlympicSportsTreemap.css';

// Custom treemap cell content
const CustomizedContent = (props) => {
  const { x, y, width, height, name, size, color } = props;
  
  // Don't render if truly too small
  if (width < 15 || height < 15) return null;
  
  // Safe values for name and size with fallbacks
  const displayName = name || '';
  const displaySize = size || 0;
  
  // Calculate font size based on box dimensions
  const boxSize = Math.min(width, height);
  
  // More aggressive scaling for smaller boxes
  const nameFontSize = Math.max(6, Math.min(12, boxSize / 10));
  const sizeFontSize = Math.max(6, Math.min(12, boxSize / 12));
  
  // Determine if text would fit
  // Less conservative estimate to show more names
  const estimatedTextWidth = displayName.length * nameFontSize * 0.5;
  
  // Truncate name if needed (for boxes that could show partial text)
  let truncatedName = displayName;
  if (estimatedTextWidth > width - 6) {
    const charsToShow = Math.floor((width - 6) / (nameFontSize * 0.5));
    if (charsToShow >= 3) { // Only truncate if we can show at least 3 chars
      truncatedName = displayName.substring(0, charsToShow) + '...';
    }
  }
  
  // More lenient conditions for showing text
  const showName = width >= 25 && height >= 25;
  const showSize = width >= 25 && height >= 25;
  
  // Prioritize name or size based on box dimensions
  const showBoth = showName && showSize && height > 50;
  const showNameOnly = showName && !showBoth; 
  const showSizeOnly = showSize && !showBoth && !showNameOnly;
  
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        className="treemap-rect"
        style={{ fill: color || '#D4AF37' }}
      />
      
      {showNameOnly && (
        <text
          x={x + width / 2}
          y={y + height / 2}
          className="treemap-name-text"
          style={{ fontSize: `${nameFontSize}px` }}
          textAnchor="middle"
          dominantBaseline="middle"
        >
          {truncatedName}
        </text>
      )}
      
      {showBoth && (
        <>
          <text
            x={x + width / 2}
            y={y + height / 2 - 7}
            className="treemap-name-text"
            style={{ fontSize: `${nameFontSize}px` }}
            textAnchor="middle"
          >
            {truncatedName}
          </text>
          <text
            x={x + width / 2}
            y={y + height / 2 + 7}
            className="treemap-size-text"
            style={{ fontSize: `${sizeFontSize}px` }}
            textAnchor="middle"
          >
            {displaySize}
          </text>
        </>
      )}
      
      {showSizeOnly && (
        <text
          x={x + width / 2}
          y={y + height / 2}
          className="treemap-size-text"
          style={{ fontSize: `${sizeFontSize}px` }}
          textAnchor="middle"
          dominantBaseline="middle"
        >
          {displaySize}
        </text>
      )}
    </g>
  );
};

// Custom tooltip for treemap
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length > 0) {
    const data = payload[0].payload;
    return (
      <div className="custom-treemap-tooltip">
        <p className="sport-name">{data.name}</p>
        <p className="athlete-count">{`${data.size} athletes`}</p>
      </div>
    );
  }
  return null;
};

const OlympicSportsTreemap = () => {
  const [data, setData] = useState({});
  const [years, setYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Get theme colors from CSS variables
  const getThemeColors = () => {
    const isDarkTheme = document.documentElement.getAttribute('data-theme') === 'dark';
    
    // Get colors from CSS variables
    const bronze = getComputedStyle(document.documentElement).getPropertyValue('--bronze').trim() || '#CD7F32';
    const silver = getComputedStyle(document.documentElement).getPropertyValue('--silver').trim() || '#C0C0C0';
    const gold = getComputedStyle(document.documentElement).getPropertyValue('--gold').trim() || '#D4AF37';
    const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim() || '#2E2E2E';
    
    return {
      bronze,
      silver,
      gold,
      textColor,
      backgroundColor: isDarkTheme ? '#2E2E2E' : '#FDFBF7'
    };
  };
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        // For debugging - using hard-coded data in case file loading is the issue
        const hardcodedData = [
          { year: 1896, discipline: "Artistic Gymnastics (Gymnastics)", athlete_count: 22 },
          { year: 1896, discipline: "Athletics", athlete_count: 64 },
          { year: 1896, discipline: "Cycling Road (Cycling)", athlete_count: 16 },
          { year: 1896, discipline: "Cycling Track (Cycling)", athlete_count: 2 },
          { year: 1896, discipline: "Fencing", athlete_count: 18 },
          { year: 1896, discipline: "Shooting", athlete_count: 33 }
        ];
        
        console.log("Processing hardcoded data:", hardcodedData);
        processData(hardcodedData);
        setLoading(false);
        
        // Still attempt to fetch the file data, but use hardcoded data as fallback
        try {
          const response = await fetch('/sp_year.csv');
          const csvText = await response.text();
          
          Papa.parse(csvText, {
            header: true,
            dynamicTyping: true, // Automatically convert numeric values
            skipEmptyLines: true,
            complete: (results) => {
              console.log("CSV data loaded:", results.data);
              if (results.data && results.data.length > 0) {
                processData(results.data);
              }
            },
            error: (error) => {
              console.error("Error parsing CSV:", error);
              // We already have hardcoded data, so don't set error state
            }
          });
        } catch (fileErr) {
          console.error("Error fetching CSV:", fileErr);
          // We already have hardcoded data, so don't set error state
        }
      } catch (err) {
        console.error("Fatal error:", err);
        setError(err.message);
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Process data to create treemap hierarchy
  const processData = (records) => {
    console.log("Processing records:", records);
    
    // Ensure records is an array and has data
    if (!Array.isArray(records) || records.length === 0) {
      console.error("No valid records to process");
      setError("No valid records to process");
      return;
    }
    
    // Extract unique years
    const yearsSet = new Set();
    records.forEach(record => {
      if (record && record.year) {
        yearsSet.add(record.year);
      }
    });
    
    console.log("Years found:", yearsSet);
    
    // Sort years chronologically
    const sortedYears = [...yearsSet].sort((a, b) => a - b);
    setYears(sortedYears);
    
    // Set default selected year to the first one if available
    if (sortedYears.length > 0) {
      const firstYear = sortedYears[0];
      console.log("Setting selected year to:", firstYear);
      setSelectedYear(firstYear);
    } else {
      console.error("No years found in the data");
      setError("No years found in the data");
      return;
    }
    
    // Generate treemap data for all years
    const allYearsData = {};
    
    sortedYears.forEach(year => {
      // Filter records for the current year
      const yearRecords = records.filter(record => record && record.year === year);
      console.log(`Records for year ${year}:`, yearRecords);
      
      if (yearRecords.length === 0) {
        console.warn(`No records found for year ${year}`);
        allYearsData[year] = [{
          name: "Disciplines",
          children: []
        }];
        return;
      }
      
      // Transform data into treemap format
      const treemapData = yearRecords.map(record => {
        // Remove text within parentheses
        const cleanedDiscipline = record.discipline ? 
          record.discipline.replace(/\s*\([^)]*\)\s*/g, '') : 
          "Unknown";
          
        return {
          name: cleanedDiscipline,
          size: record.athlete_count || 0,
          // We'll calculate color based on athlete count
          color: null // Will be set below
        };
      });
      
      // Remove any items with zero size
      const filteredData = treemapData.filter(item => item.size > 0);
      
      // Find min and max values for color scaling
      const sizes = filteredData.map(item => item.size);
      if (sizes.length === 0) {
        console.warn(`No valid sizes for year ${year}`);
        return;
      }
      
      const min = Math.min(...sizes);
      const max = Math.max(...sizes);
      
      // Assign colors based on athlete count
      filteredData.forEach(item => {
        item.color = getColorForValue(item.size, min, max);
      });
      
      // Sort by size descending to help with layout
      filteredData.sort((a, b) => b.size - a.size);
      
      allYearsData[year] = [{
        name: "Disciplines",
        children: filteredData
      }];
    });
    
    console.log("Processed data:", allYearsData);
    setData(allYearsData);
  };
  
  // Generate color based on value
  const getColorForValue = (value, min, max) => {
    // Use hardcoded colors as fallbacks to ensure they work in production
    const defaultColors = {
      bronze: '#CD7F32',
      silver: '#C0C0C0', 
      gold: '#D4AF37'
    };
    
    const colors = getThemeColors();
    
    // If min and max are the same, return gold color
    if (min === max) return colors.gold || defaultColors.gold;
    
    // Map value to a position in the range [0, 1]
    const ratio = (value - min) / (max - min);
    
    // Convert hex to rgb with better error handling
    const hexToRgb = (hex) => {
      // Remove # if present
      hex = hex.replace('#', '');
      
      // Handle 3-digit hex
      if (hex.length === 3) {
        hex = hex.split('').map(char => char + char).join('');
      }
      
      // Validate hex format
      if (hex.length !== 6 || !/^[0-9A-Fa-f]{6}$/.test(hex)) {
        return null;
      }
      
      return {
        r: parseInt(hex.substr(0, 2), 16),
        g: parseInt(hex.substr(2, 2), 16),
        b: parseInt(hex.substr(4, 2), 16)
      };
    };
    
    // Try to get colors from CSS variables, fallback to defaults
    const bronzeHex = colors.bronze || defaultColors.bronze;
    const silverHex = colors.silver || defaultColors.silver;
    const goldHex = colors.gold || defaultColors.gold;
    
    // Get RGB values for all three colors
    const bronzeRgb = hexToRgb(bronzeHex) || hexToRgb(defaultColors.bronze);
    const silverRgb = hexToRgb(silverHex) || hexToRgb(defaultColors.silver);
    const goldRgb = hexToRgb(goldHex) || hexToRgb(defaultColors.gold);
    
    // Final fallback if all else fails
    if (!bronzeRgb || !silverRgb || !goldRgb) {
      console.warn('Color parsing failed, using default gold');
      return defaultColors.gold;
    }
    
    let r, g, b;
    
    // Create a three-part gradient: bronze -> silver -> gold
    if (ratio < 0.5) {
      // First half: bronze to silver
      const adjustedRatio = ratio * 2; // Scale to [0, 1] for this segment
      r = Math.round(bronzeRgb.r + (silverRgb.r - bronzeRgb.r) * adjustedRatio);
      g = Math.round(bronzeRgb.g + (silverRgb.g - bronzeRgb.g) * adjustedRatio);
      b = Math.round(bronzeRgb.b + (silverRgb.b - bronzeRgb.b) * adjustedRatio);
    } else {
      // Second half: silver to gold
      const adjustedRatio = (ratio - 0.5) * 2; // Scale to [0, 1] for this segment
      r = Math.round(silverRgb.r + (goldRgb.r - silverRgb.r) * adjustedRatio);
      g = Math.round(silverRgb.g + (goldRgb.g - silverRgb.g) * adjustedRatio);
      b = Math.round(silverRgb.b + (goldRgb.b - silverRgb.b) * adjustedRatio);
    }
    
    return `rgb(${r}, ${g}, ${b})`;
  };
  
  // Handle year change
  const handleYearChange = (e) => {
    const value = parseInt(e.target.value);
    
    // Find the closest available year in our years array
    if (years.includes(value)) {
      setSelectedYear(value);
    } else {
      // Find the closest year
      const closest = years.reduce((prev, curr) => {
        return (Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev);
      });
      setSelectedYear(closest);
    }
  };
  
  if (loading) {
    return (
      <div className="treemap-loading-container">
        <div className="treemap-loading-spinner"></div>
        <p>Loading Olympic sports data...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="treemap-error-container">
        <p>Error loading data: {error}</p>
      </div>
    );
  }
  
  return (
    <div className="treemap-container">
      <h2 className="treemap-title">Olympic Disciplines Distribution</h2>
      <p className="treemap-subtitle">
        Athletes per discipline in {selectedYear || 'loading...'}
      </p>
      
      {/* Debug info */}
      <div style={{ display: 'none' }}>
        <p>Debug - Years available: {years.join(', ')}</p>
        <p>Debug - Selected year: {selectedYear}</p>
        <p>Debug - Has data for selected year: {selectedYear && data[selectedYear] ? 'Yes' : 'No'}</p>
      </div>
      
      {years.length > 0 && (
        <div className="year-slider-container">
          <input 
            type="range" 
            min={Math.min(...years)} 
            max={Math.max(...years)} 
            value={selectedYear || years[0]}
            onChange={handleYearChange}
            className="year-slider"
            // Use exact years from data instead of step
            list="year-ticks"
          />
          <datalist id="year-ticks">
            {years.map(year => (
              <option key={year} value={year} />
            ))}
          </datalist>
          <div className="year-label">{selectedYear || years[0]}</div>
        </div>
      )}
      
      <div className="treemap-wrapper">
        {selectedYear && data[selectedYear] && data[selectedYear][0] && 
         data[selectedYear][0].children && data[selectedYear][0].children.length > 0 ? (
          <ResponsiveContainer width="100%" height={500}>
            <Treemap
              data={data[selectedYear][0].children}
              dataKey="size"
              stroke="#fff"
              content={<CustomizedContent />}
              animationDuration={600}
              aspectRatio={1}  // Help with space utilization
              paddingInner={1} // Minimal padding between cells
              isAnimationActive={false} // Can help with layout issues
            >
              <Tooltip content={<CustomTooltip />} />
            </Treemap>
          </ResponsiveContainer>
        ) : (
          <div className="no-data-message">
            <p>No data available for {selectedYear || 'selected year'}</p>
          </div>
        )}
      </div>
      
      <div className="treemap-footer">
        <p className="treemap-note">* Size represents the number of athletes in each discipline</p>
      </div>
    </div>
  );
};

export default OlympicSportsTreemap;