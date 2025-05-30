import React, { useState, useEffect, useRef } from 'react';
import Papa from 'papaparse';
import './css/MedalRaceChart.css';
// Import SVG icons
import { ReactComponent as PlayIcon } from '../assets/play-solid.svg';
import { ReactComponent as PauseIcon } from '../assets/pause-solid.svg';
import { ReactComponent as PrevIcon } from '../assets/rewind-solid.svg';
import { ReactComponent as NextIcon } from '../assets/forward-solid.svg';

const MedalRaceChart = () => {
  const [data, setData] = useState([]);
  const [years, setYears] = useState([]);
  const [countries, setCountries] = useState([]);
  const [selectedCountries, setSelectedCountries] = useState([]);
  const [currentYear, setCurrentYear] = useState(null);
  const [currentYearIndex, setCurrentYearIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [cumulativeData, setCumulativeData] = useState({});
  const [sortedData, setSortedData] = useState([]);
  const [maxMedals, setMaxMedals] = useState(0);
  const animationRef = useRef(null);
  const dropdownRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const timelineRef = useRef(null);

  // Load data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/medal_race.csv');
        const csvText = await response.text();

        Papa.parse(csvText, {
          header: true,
          complete: (results) => {
            const medalData = results.data.filter(item => 
              item.year && item.country && item.total && !isNaN(parseInt(item.total))
            );
            
            // Extract unique years and sort them
            const uniqueYears = [...new Set(medalData.map(item => item.year))].sort();
            setYears(uniqueYears);
            
            // Set first year as current year
            if (uniqueYears.length > 0) {
              setCurrentYear(uniqueYears[0]);
            }
            
            // Extract unique countries and sort alphabetically
            const uniqueCountries = [...new Set(medalData.map(item => item.country))].sort((a, b) => a.localeCompare(b));
            setCountries(uniqueCountries);
            
            // No countries selected by default
            setSelectedCountries([]);
            setData(medalData);
            // Calculate cumulative data (empty selection)
            calculateCumulativeData(medalData, uniqueYears, []);
          }
        });
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    fetchData();
  }, []);

  // Calculate cumulative medal data for each country over years
  const calculateCumulativeData = (medalData, years, selectedCountriesList) => {
    const cumulative = {};
    
    // Initialize cumulative object for each country
    selectedCountriesList.forEach(country => {
      cumulative[country] = {};
      years.forEach(year => {
        cumulative[country][year] = 0;
      });
    });
    
    // Calculate cumulative sums
    selectedCountriesList.forEach(country => {
      let runningTotal = 0;
      years.forEach(year => {
        const yearData = medalData.find(item => item.country === country && item.year === year);
        if (yearData) {
          runningTotal += parseInt(yearData.total);
        }
        cumulative[country][year] = runningTotal;
      });
    });
    
    setCumulativeData(cumulative);
    updateSortedData(years[0], cumulative, selectedCountriesList);
  };

  // Update sorted data whenever selection or year changes
  const updateSortedData = (year, cumulativeDataObj, selectedCountriesList) => {
    if (!year || !cumulativeDataObj || selectedCountriesList.length === 0) return;
    
    // Create sorted array of countries with their cumulative medal counts
    const sortedArray = selectedCountriesList
      .map(country => ({
        country,
        count: cumulativeDataObj[country][year] || 0
      }))
      .sort((a, b) => b.count - a.count);
    
    setSortedData(sortedArray);
    
    // Find maximum medal count for scaling
    const max = Math.max(...sortedArray.map(item => item.count));
    setMaxMedals(max);
  };

  // Handle country selection changes
  useEffect(() => {
    if (data.length > 0 && years.length > 0 && selectedCountries.length > 0) {
      calculateCumulativeData(data, years, selectedCountries);
    }
  }, [selectedCountries]);

  // Animation frame handling
  useEffect(() => {
    let animationId;
    
    const animate = () => {
      if (isPlaying && years.length > 0) {
        setCurrentYearIndex(prevIndex => {
          // If we reached the end, stop playing
          if (prevIndex >= years.length - 1) {
            setIsPlaying(false);
            return prevIndex;
          }
          
          const nextIndex = prevIndex + 1;
          setCurrentYear(years[nextIndex]);
          return nextIndex;
        });
        
        // Schedule next frame after delay
        animationId = setTimeout(() => {
          animationRef.current = requestAnimationFrame(animate);
        }, 1000); // Update every second
      }
    };
    
    if (isPlaying) {
      animationRef.current = requestAnimationFrame(animate);
    }
    
    return () => {
      if (animationId) clearTimeout(animationId);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, years]);

  // Update chart when current year changes
  useEffect(() => {
    if (currentYear && Object.keys(cumulativeData).length > 0) {
      updateSortedData(currentYear, cumulativeData, selectedCountries);
    }
  }, [currentYear, cumulativeData]);

  // Handle dropdown toggle
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Timeline control handlers
  const handleTimelineClick = (e) => {
    const timeline = e.currentTarget;
    const rect = timeline.getBoundingClientRect();
    const position = (e.clientX - rect.left) / rect.width;
    const newIndex = Math.min(Math.floor(position * years.length), years.length - 1);
    
    setCurrentYearIndex(newIndex);
    setCurrentYear(years[newIndex]);
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handlePrevYear = () => {
    if (currentYearIndex > 0) {
      const newIndex = currentYearIndex - 1;
      setCurrentYearIndex(newIndex);
      setCurrentYear(years[newIndex]);
    }
  };

  const handleNextYear = () => {
    if (currentYearIndex < years.length - 1) {
      const newIndex = currentYearIndex + 1;
      setCurrentYearIndex(newIndex);
      setCurrentYear(years[newIndex]);
    }
  };

  // Country selection handlers
  const toggleCountry = (country) => {
    setSelectedCountries(prev => {
      // If already selected, remove it
      if (prev.includes(country)) {
        return prev.filter(c => c !== country);
      }
      
      // If we're at max countries, don't add more
      if (prev.length >= 10) {
        return prev;
      }
      
      // Add the country
      return [...prev, country];
    });
  };

  const selectRandom = () => {
    // Get the maximum number of countries to select (currently 10)
    const maxCountries = 10;
    
    // Shuffle the array and take the first maxCountries elements
    const shuffledCountries = [...countries].sort(() => 0.5 - Math.random());
    const randomSelection = shuffledCountries.slice(0, maxCountries);
    
    setSelectedCountries(randomSelection);
  };

  const deselectAll = () => {
    setSelectedCountries([]);
  };

  // Add drag event handlers for timeline thumb
  const handleThumbMouseDown = (e) => {
    // Stop event propagation to prevent timeline click event
    e.stopPropagation();
    setIsDragging(true);
    
    // If playing, pause while dragging
    if (isPlaying) {
      setIsPlaying(false);
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !timelineRef.current) return;
    
    const timeline = timelineRef.current;
    const rect = timeline.getBoundingClientRect();
    
    // Calculate relative position (0 to 1)
    let position = (e.clientX - rect.left) / rect.width;
    
    // Clamp position between 0 and 1
    position = Math.max(0, Math.min(1, position));
    
    // Calculate new year index more precisely
    const yearIndexFloat = position * (years.length - 1);
    const newIndex = Math.min(Math.round(yearIndexFloat), years.length - 1);
    
    // Only update if the index has changed
    if (newIndex !== currentYearIndex) {
      setCurrentYearIndex(newIndex);
      setCurrentYear(years[newIndex]);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Add event listeners for mouse move and mouse up
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, years]);

  // Render functions
  const renderDropdown = () => {
    return (
      <div className="medal-race-dropdown-container">
        <div className="medal-race-dropdown-header">
          <span className="medal-race-dropdown-label">Select Countries (max 10)</span>
          <div className="medal-race-dropdown-actions">
            <button className="medal-race-dropdown-action" onClick={selectRandom}>
              Random Selection
            </button>
            <button className="medal-race-dropdown-action" onClick={deselectAll}>
              Deselect All
            </button>
          </div>
        </div>
        
        <div className="medal-race-dropdown" ref={dropdownRef}>
          <div 
            className="medal-race-dropdown-select" 
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <span>
              {selectedCountries.length === 0 
                ? 'Select countries' 
                : `${selectedCountries.length} ${selectedCountries.length === 1 ? 'country' : 'countries'} selected`}
            </span>
            <span>{showDropdown ? '▲' : '▼'}</span>
          </div>
          
          <div className={`medal-race-dropdown-menu ${showDropdown ? 'open' : ''}`}>
            {countries.map(country => (
              <div
                key={country}
                className="medal-race-dropdown-option"
                onClick={() => toggleCountry(country)}
              >
                <input
                  type="checkbox"
                  className="medal-race-dropdown-checkbox"
                  checked={selectedCountries.includes(country)}
                  readOnly
                />
                {country}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Add a replay handler
  const handleReplay = () => {
    // First stop any ongoing animation
    setIsPlaying(false);
    
    // Reset to the beginning - explicitly set to the first year
    setCurrentYearIndex(0);
    if (years.length > 0) {
      setCurrentYear(years[0]); // Ensure we set to the first year
    }
    
    // Start playing after a longer delay to ensure the reset animation completes
    setTimeout(() => {
      setIsPlaying(true);
    }, 1000); // Increased delay to ensure the thumb animation completes
  };

  const renderTimeline = () => {
    if (!years.length) return null;
    
    // Calculate progress as a percentage of the timeline
    const progress = currentYearIndex / Math.max(1, years.length - 1) * 100;
    
    // Determine if we're at start or end position
    const isAtStart = currentYearIndex === 0;
    const isAtEnd = currentYearIndex >= years.length - 1;
    
    // Create class name with conditional classes for start/end positions
    const thumbClassName = `medal-race-timeline-thumb ${isAtStart ? 'at-start' : ''} ${isAtEnd ? 'at-end' : ''} ${isDragging ? 'dragging' : ''}`.trim();
    
    // Set the thumb position only for non-boundary positions
    // For at-start and at-end, we'll let CSS handle it
    const thumbStyle = {};
    if (!isAtStart && !isAtEnd) {
      thumbStyle.left = `${progress}%`;
    }
    
    // Check if controls should be disabled
    const controlsDisabled = selectedCountries.length === 0;
    
    return (
      <div className="medal-race-timeline-container">
        <div className="medal-race-timeline-label">
          <span></span>
          <span className="medal-race-year-display">{currentYear}</span>
        </div>
        
        <div 
          className="medal-race-timeline" 
          onClick={handleTimelineClick}
          ref={timelineRef}
        >
          <div 
            className={`medal-race-timeline-progress ${isDragging ? 'dragging' : ''}`}
            style={{ width: `${progress}%` }}
          ></div>
          <div 
            className={thumbClassName}
            style={thumbStyle}
            onMouseDown={handleThumbMouseDown}
          >
          </div>
        </div>
        
        <div className="medal-race-play-controls">
          <button 
            className={`medal-race-control-button ${controlsDisabled ? 'disabled' : ''}`}
            onClick={handlePrevYear} 
            aria-label="Previous Year"
            disabled={controlsDisabled}
          >
            <PrevIcon className="control-icon" style={{ fill: 'var(--gold)', stroke: 'var(--gold)' }} />
          </button>
          <button 
            className={`medal-race-control-button play-pause ${controlsDisabled ? 'disabled' : ''}`}
            onClick={currentYearIndex >= years.length - 1 ? handleReplay : handlePlayPause}
            aria-label={currentYearIndex >= years.length - 1 ? "Replay" : isPlaying ? "Pause" : "Play"}
            disabled={controlsDisabled}
          >
            {currentYearIndex >= years.length - 1 ? 
              <span className="replay-icon">↻</span> : 
              isPlaying ? 
                <PauseIcon className="control-icon" style={{ fill: 'var(--gold)', stroke: 'var(--gold)' }} /> :
                <PlayIcon className="control-icon" style={{ fill: 'var(--gold)', stroke: 'var(--gold)' }} />
            }
          </button>
          <button 
            className={`medal-race-control-button ${controlsDisabled ? 'disabled' : ''}`}
            onClick={handleNextYear} 
            aria-label="Next Year"
            disabled={controlsDisabled}
          >
            <NextIcon className="control-icon" style={{ fill: 'var(--gold)', stroke: 'var(--gold)' }} />
          </button>
        </div>
      </div>
    );
  };

  const renderBarChart = () => {
    if (selectedCountries.length === 0) {
      return (
        <div className="medal-race-empty-state">
          <p>Please select at least one country to display the medal count chart.</p>
        </div>
      );
    }
    
    if (!sortedData.length) return null;
    
    // Get min and max medal counts for color scaling
    const minMedals = Math.min(...sortedData.map(item => item.count));
    const maxMedals = Math.max(...sortedData.map(item => item.count));
    const medalRange = maxMedals - minMedals;
    
    return (
      <div className="medal-race-chart-container">
        {sortedData.map((item, index) => {
          const widthPercentage = (item.count / maxMedals) * 100;
          
          // Calculate color level based on medal count relative to range
          let colorLevel;
          if (medalRange === 0) {
            // If all countries have same medal count, use middle level
            colorLevel = 5;
          } else {
            // Calculate relative position in the medal range (0 to 1)
            const relativePosition = (item.count - minMedals) / medalRange;
            // Scale to levels (1-10)
            colorLevel = Math.ceil(relativePosition * 10);
            // Ensure we're within bounds
            colorLevel = Math.max(1, Math.min(10, colorLevel));
          }
          
          // Apply color class based on calculated level
          const colorClass = `level${colorLevel}`;
          
          return (
            <div 
              key={item.country} 
              className="medal-race-bar"
              data-country={item.country}
            >
              <div className="medal-race-bar-label">{item.country}</div>
              <div 
                className={`medal-race-bar-value ${colorClass}`}
                style={{ width: `${Math.max(5, widthPercentage)}%` }}
              >
                <span className="medal-race-bar-count">{item.count}</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="medal-race-container">
      <div className="medal-race-header">
        <h2 className="medal-race-title">Olympic Medals Race</h2>
        {/* <p className="medal-race-subtitle">
          Watch how countries compete for Olympic glory throughout history.
          Select up to 10 countries to compare their cumulative medal counts.
        </p> */}
      </div>
      
      <div className="medal-race-controls">
        {renderDropdown()}
        {renderTimeline()}
      </div>
      
      {renderBarChart()}
      
    </div>
  );
};

export default MedalRaceChart; 