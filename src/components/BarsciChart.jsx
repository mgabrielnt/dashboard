import { useTheme } from "@mui/material";
import { ResponsiveBar } from "@nivo/bar";
import { tokens } from "../theme";
import { useState, useEffect } from "react";
import axios from "axios";

const BarsciChart = ({ isDashboard = false }) => {
  const [data, setData] = useState([]);
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Configure axios with all credentials options
        const response = await axios.get('http://localhost:5000/api/barsci', {
          withCredentials: true,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        
        const jsonData = response.data;
        console.log('Raw API Response:', jsonData);
        
        // Process data with detailed logging
        let processedData;
        if (Array.isArray(jsonData)) {
          console.log('Using direct array data');
          processedData = jsonData;
        } else if (jsonData && typeof jsonData === 'object') {
          if (Array.isArray(jsonData.data)) {
            console.log('Using nested data array');
            processedData = jsonData.data;
          } else if (jsonData.results && Array.isArray(jsonData.results)) {
            console.log('Using results array');
            processedData = jsonData.results;
          } else if (jsonData.rows && Array.isArray(jsonData.rows)) {
            console.log('Using rows array');
            processedData = jsonData.rows;
          } else {
            console.log('Converting object to array');
            processedData = Object.keys(jsonData).map(key => {
              return { bulan: key, sci: jsonData[key] };
            });
          }
        } else {
          throw new Error("Invalid data format received from server");
        }
        
        // Normalize data structure
        const normalizedData = processedData.map(item => ({
          bulan: item.bulan || item.month || item.year || 'Unknown',
          sci: item.sci || item.value || 0
        }));
        
        setData(normalizedData);
      } catch (error) {
        console.error("Error fetching bar chart data:", error);
        setData([]);
      }
    };

    fetchData();
  }, []);

  // If data is empty, return loading indicator
  if (data.length === 0) {
    return <div>Loading...</div>;
  }

  return (
    <ResponsiveBar
      data={data}
      keys={["sci"]}
      indexBy="bulan"
      theme={{
        axis: {
          domain: {
            line: {
              stroke: colors.grey[100],
            },
          },
          legend: {
            text: {
              fill: colors.grey[100],
            },
          },
          ticks: {
            line: {
              stroke: colors.grey[100],
              strokeWidth: 1,
            },
            text: {
              fill: colors.grey[100],
            },
          },
        },
        legends: {
          text: {
            fill: colors.grey[100],
          },
        },
      }}
      margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
      padding={0.3}
      valueScale={{ type: "linear" }}
      indexScale={{ type: "band", round: true }}
      colors={{ scheme: "blues" }}
      axisBottom={{
        tickSize: 5,
        tickPadding: 5,
        tickRotation: 0,
        legend: isDashboard ? undefined : "Bulan",
        legendPosition: "middle",
        legendOffset: 32,
      }}
      axisLeft={{
        tickSize: 5,
        tickPadding: 5,
        tickRotation: 0,
        legend: isDashboard ? undefined : "SCI",
        legendPosition: "middle",
        legendOffset: -40,
        format: (value) => 
          value >= 1000000000 
            ? `${(value / 1000000000).toFixed(1)} M` 
            : value.toLocaleString()
      }}
      enableLabel={true}
      labelSkipWidth={12}
      labelSkipHeight={12}
      labelTextColor={{
        from: "color",
        modifiers: [["darker", 1.6]],
      }}
      legends={[
        {
          dataFrom: "keys",
          anchor: "bottom-right",
          direction: "column",
          justify: false,
          translateX: 120,
          translateY: 0,
          itemsSpacing: 2,
          itemWidth: 100,
          itemHeight: 20,
          itemDirection: "left-to-right",
          itemOpacity: 0.85,
          symbolSize: 20,
          effects: [
            {
              on: "hover",
              style: {
                itemOpacity: 1,
              },
            },
          ],
        },
      ]}
      role="application"
      barAriaLabel={function (e) {
        return `SCI for month ${e.indexValue}: ${e.formattedValue}`;
      }}
    />
  );
};

export default BarsciChart;