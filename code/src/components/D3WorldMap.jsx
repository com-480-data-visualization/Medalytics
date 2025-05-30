import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { feature } from 'topojson-client';
import Papa from 'papaparse';
import './css/WorldMap.css';

const D3WorldMap = () => {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [olympicData, setOlympicData] = useState({});
  const [worldData, setWorldData] = useState(null); // Store world data to avoid refetching
  const [medalData, setMedalData] = useState({});
  const [years, setYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState('overall');
  const [showSideWindow, setShowSideWindow] = useState(false);
  
  // Store zoom state
  const zoomStateRef = useRef({
    transform: null,
    scale: 1,
    x: 0,
    y: 0
  });

  // Load the CSV data
  useEffect(() => {
    const loadCSVData = async () => {
      try {
        // Assuming the CSV file is in the public folder
        const response = await fetch('/countries.csv');
        const csvText = await response.text();
        
        const results = Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true
        });
        
        // Process the data into a map for easy lookup
        const dataMap = {};
        results.data.forEach(row => {
          // Clean up country names (remove quotes and newlines)
          const countryName = row.Country.replace(/"/g, '').replace(/\n/g, ' ').trim();
          
          // Store data by country name
          dataMap[countryName] = {
            athletes: parseInt(row['Number of Athletes']) || 0
          };
        });
        
        console.log("CSV data loaded:", Object.keys(dataMap).length, "countries");
        setOlympicData(dataMap);
      } catch (error) {
        console.error("Error loading CSV data:", error);
        setError("Failed to load Olympic data. Using placeholder data instead.");
      }
    };
    
    loadCSVData();
  }, []);

  // Load medal data
  useEffect(() => {
    const loadMedalData = async () => {
      try {
        const response = await fetch('/medals.csv');
        const csvText = await response.text();
        
        const results = Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true
        });
        
        // Process the data into a map for easy lookup
        const dataMap = {};
        const uniqueYears = new Set();
        
        results.data.forEach(row => {
          const year = row.year;
          const country = row.country;
          
          if (year && country) {
            uniqueYears.add(year);
            
            if (!dataMap[country]) {
              dataMap[country] = {};
            }
            
            if (!dataMap[country][year]) {
              dataMap[country][year] = {
                gold: parseInt(row.Gold) || 0,
                silver: parseInt(row.Silver) || 0,
                bronze: parseInt(row.Bronze) || 0,
                total: parseInt(row.total) || 0,
                athleteCount: parseInt(row.athlete_count) || 0
              };
            }
          }
        });
        
        // Calculate overall totals for each country
        Object.keys(dataMap).forEach(country => {
          dataMap[country]['overall'] = {
            gold: 0,
            silver: 0,
            bronze: 0,
            total: 0,
            athleteCount: 0
          };
          
          Object.keys(dataMap[country]).forEach(year => {
            if (year !== 'overall') {
              dataMap[country]['overall'].gold += dataMap[country][year].gold;
              dataMap[country]['overall'].silver += dataMap[country][year].silver;
              dataMap[country]['overall'].bronze += dataMap[country][year].bronze;
              dataMap[country]['overall'].total += dataMap[country][year].total;
              dataMap[country]['overall'].athleteCount += dataMap[country][year].athleteCount;
            }
          });
        });
        
        // Sort years chronologically
        const sortedYears = Array.from(uniqueYears).sort();
        
        setYears(sortedYears);
        setMedalData(dataMap);
        console.log("Medal data loaded:", Object.keys(dataMap).length, "countries");
      } catch (error) {
        console.error("Error loading medal data:", error);
        setError("Failed to load Olympic medal data.");
      }
    };
    
    loadMedalData();
  }, []);

  // Fetch world data only once
  useEffect(() => {
    const fetchWorldData = async () => {
      try {
        if (!worldData) {
          console.log("Fetching world data...");
          const response = await fetch('https://unpkg.com/world-atlas@2.0.2/countries-110m.json');
          const data = await response.json();
          
          // Convert TopoJSON to GeoJSON
          const countries = feature(data, data.objects.countries);
          console.log(`Processed ${countries.features.length} country features`);
          setWorldData(countries);
        }
      } catch (error) {
        console.error("Error loading world data:", error);
        setError("Failed to load world map data.");
      }
    };
    
    fetchWorldData();
  }, [worldData]);

  // Helper function to find country data from our CSV dataset - kept simple
  const findCountryData = (countryName) => {
    const cleanName = countryName.trim();
    
    // Try direct lookup
    if (olympicData[cleanName]) {
      return olympicData[cleanName];
    }
    
    // Try case-insensitive lookup
    const keys = Object.keys(olympicData);
    const lowerName = cleanName.toLowerCase();
    
    const matchKey = keys.find(key => key.toLowerCase() === lowerName);
    if (matchKey) {
      return olympicData[matchKey];
    }
    
    // Try partial match as a fallback
    for (const key of keys) {
      if (key.toLowerCase().includes(lowerName) || lowerName.includes(key.toLowerCase())) {
        return olympicData[key];
      }
    }
    
    return null;
  };

  // Helper function to find medal data
  const findMedalData = (countryName) => {
    const cleanName = countryName.trim();
    
    // Try direct lookup
    if (medalData[cleanName]) {
      return medalData[cleanName];
    }
    
    // Try case-insensitive lookup
    const keys = Object.keys(medalData);
    const lowerName = cleanName.toLowerCase();
    
    const matchKey = keys.find(key => key.toLowerCase() === lowerName);
    if (matchKey) {
      return medalData[matchKey];
    }
    
    // Try partial match as a fallback
    for (const key of keys) {
      if (key.toLowerCase().includes(lowerName) || lowerName.includes(key.toLowerCase())) {
        return medalData[key];
      }
    }
    
    return null;
  };

  // Function to get current theme colors
  const getThemeColors = () => {
    const isDarkTheme = document.documentElement.getAttribute('data-theme') === 'dark';
    return {
      background: getComputedStyle(document.documentElement).getPropertyValue('--bg-primary').trim(),
      countryFill: isDarkTheme ? '#555555' : '#E0E0E0', 
      countryStroke: isDarkTheme ? '#777777' : '#C0C0C0',
      selectedFill: getComputedStyle(document.documentElement).getPropertyValue('--gold').trim(),
      hoverFill: getComputedStyle(document.documentElement).getPropertyValue('--silver').trim()
    };
  };

  // Create or update the map when world data changes or when selection changes
  useEffect(() => {
    // Skip if refs not ready or world data not loaded
    if (!svgRef.current || !containerRef.current || !worldData) return;
    
    console.log("Updating map...");
    setIsLoading(true);
    
    // Get container dimensions
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = 700;
    
    // Get SVG element
    const svg = d3.select(svgRef.current);
    
    // Clear previous content
    svg.selectAll("*").remove();
    
    // Get theme colors
    const colors = getThemeColors();
    
    // Set SVG attributes
    svg
      .attr("width", width)
      .attr("height", height)
      .style("background-color", colors.background);
      
    // Create a map projection
    const projection = d3.geoMercator()
      .scale(width / 2 / Math.PI)
      .center([0, 20])
      .translate([width / 2, height / 2]);
    
    // Create path generator
    const path = d3.geoPath().projection(projection);
    
    // Group for map elements
    const g = svg.append("g");
    
    // Draw countries
    g.selectAll("path")
      .data(worldData.features)
      .enter()
      .append("path")
      .attr("d", path)
      .attr("fill", d => selectedCountry && selectedCountry.id === d.id ? colors.selectedFill : colors.countryFill)
      .attr("stroke", colors.countryStroke)
      .attr("stroke-width", 0.5)
      .attr("class", "country")
      .on("mouseover", function(event, d) {
        d3.select(this).attr("fill", colors.hoverFill);
      })
      .on("mouseout", function(event, d) {
        const isSelected = selectedCountry && selectedCountry.id === d.id;
        d3.select(this).attr("fill", isSelected ? colors.selectedFill : colors.countryFill);
      })
      .on("click", function(event, d) {
        // Get country data
        const countryName = d.properties.name;
        const countryData = findCountryData(countryName);
        const countryMedalData = findMedalData(countryName);
        
        // Store current zoom state before updating (important to do this before setting state)
        // We don't want to store the state if it's the first render
        if (g.attr("transform")) {
          zoomStateRef.current.transform = g.attr("transform");
          
          // Also store scale and translation for backup
          const transform = d3.zoomTransform(g.node());
          zoomStateRef.current.scale = transform.k;
          zoomStateRef.current.x = transform.x;
          zoomStateRef.current.y = transform.y;
        }
        
        // Check if the same country is clicked twice
        if (selectedCountry && selectedCountry.id === d.id) {
          setShowSideWindow(!showSideWindow);
          return;
        }
        
        // Update selected country state
        setSelectedCountry({
          id: d.id,
          name: countryName,
          athletes: countryData?.athletes || 0,
          medals: countryMedalData || {}
        });
        
        // Show side window
        setShowSideWindow(true);
      });
    
    // Add zoom and pan behavior
    const zoom = d3.zoom()
      .scaleExtent([1, 8])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
        
        // Store current zoom state
        zoomStateRef.current.scale = event.transform.k;
        zoomStateRef.current.x = event.transform.x;
        zoomStateRef.current.y = event.transform.y;
      });
    
    svg.call(zoom);
    
    // Restore previous zoom state if available
    if (zoomStateRef.current.transform) {
      g.attr("transform", zoomStateRef.current.transform);
    } else if (zoomStateRef.current.scale !== 1) {
      // Apply stored scale and translation
      const transform = d3.zoomIdentity
        .translate(zoomStateRef.current.x, zoomStateRef.current.y)
        .scale(zoomStateRef.current.scale);
      
      svg.call(zoom.transform, transform);
    }
    
    setIsLoading(false);
    
    // Add theme change listener to update map colors
    const handleThemeChange = () => {
      const newColors = getThemeColors();
      
      svg.style("background-color", newColors.background);
      
      g.selectAll("path")
        .attr("fill", d => selectedCountry && selectedCountry.id === d.id ? newColors.selectedFill : newColors.countryFill)
        .attr("stroke", newColors.countryStroke);
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
  }, [worldData, selectedCountry, olympicData, medalData]); // Redraw when selected country changes

  // Handle year selection change
  const handleYearChange = (e) => {
    setSelectedYear(e.target.value);
  };
  
  // Close side window
  const handleCloseSideWindow = () => {
    setShowSideWindow(false);
  };

  useEffect(() => {
    // This will ensure the side window is properly hidden when showSideWindow is false
    if (!showSideWindow && selectedCountry) {
      const sideWindow = document.querySelector('.country-side-window');
      if (sideWindow) {
        sideWindow.classList.remove('open');
      }
    }
  }, [showSideWindow, selectedCountry]);

  return (
    <div className={`world-map-container ${showSideWindow ? 'with-side-window' : ''}`} ref={containerRef}>
      <h2 className="map-title">Olympic World Map</h2>
      
      <div className="map-wrapper">
        <div className={`map-container ${showSideWindow ? 'map-shifted' : ''}`}>
          {isLoading && (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading map data...</p>
            </div>
          )}
          
          {error && (
            <div className="error-container">
              <p>{error}</p>
            </div>
          )}
          
          {/* Use absolute positioning to layer SVG under loading indicator */}
          <svg 
            ref={svgRef} 
            style={{ 
              width: '100%', 
              height: '700px',
              display: isLoading ? 'none' : 'block' 
            }} 
          />
        </div>
        
        {selectedCountry && (
          <div className={`country-side-window ${showSideWindow ? 'open' : ''}`} aria-hidden={!showSideWindow}>
            <div className="side-window-header">
              <h3>{selectedCountry.name}</h3>
              <button className="close-button" onClick={handleCloseSideWindow} aria-label="Close"></button>
            </div>
            
            <div className="side-window-controls">
              <label htmlFor="year-select">Select Year:</label>
              <select 
                id="year-select" 
                value={selectedYear} 
                onChange={handleYearChange}
                className="year-select"
              >
                <option value="overall">Overall (All Years)</option>
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            
            <div className="medal-stats">
              {selectedCountry.medals && selectedCountry.medals[selectedYear] ? (
                <>
                  <div className="medal-stat-item gold">
                    <h4>Gold Medals</h4>
                    <div className="medal-value">{selectedCountry.medals[selectedYear].gold.toLocaleString()}</div>
                  </div>
                  <div className="medal-stat-item silver">
                    <h4>Silver Medals</h4>
                    <div className="medal-value">{selectedCountry.medals[selectedYear].silver.toLocaleString()}</div>
                  </div>
                  <div className="medal-stat-item bronze">
                    <h4>Bronze Medals</h4>
                    <div className="medal-value">{selectedCountry.medals[selectedYear].bronze.toLocaleString()}</div>
                  </div>
                  <div className="medal-stat-item total">
                    <h4>Total Medals</h4>
                    <div className="medal-value">{selectedCountry.medals[selectedYear].total.toLocaleString()}</div>
                  </div>
                  <div className="medal-stat-item athletes">
                    <h4>Athletes</h4>
                    <div className="medal-value">{selectedCountry.medals[selectedYear].athleteCount.toLocaleString()}</div>
                  </div>
                </>
              ) : (
                <div className="no-data-message">
                  No medal data available for {selectedCountry.name} in {selectedYear === 'overall' ? 'any Olympic games' : `the ${selectedYear} Olympics`}.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default D3WorldMap;