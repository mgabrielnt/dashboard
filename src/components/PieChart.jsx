import { ResponsivePie } from "@nivo/pie";
import { tokens } from "../theme";
import { useTheme } from "@mui/material";
import { useState, useEffect } from "react";
import axios from "axios";

const PieChart = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/pie");
        
        // Format the values as billions for better readability
        const formattedData = response.data.map((item, index) => ({
          ...item,
          value: item.value, // Keep original value for calculations
          formattedValue: (item.value / 1000000000).toFixed(2) + " B", // For display
          color: getColorByIndex(index) // Assign consistent colors
        }));
        
        setData(formattedData);
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch pie chart data:", err);
        setError("Failed to load data");
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Function to generate consistent colors for pie segments
  const getColorByIndex = (index) => {
    const colorScheme = [
      colors.greenAccent[500],
      colors.blueAccent[400],
      colors.redAccent[500],
      colors.grey[400]
    ];
    return colorScheme[index % colorScheme.length];
  };

  // Format large numbers to billions with 2 decimal places
  const formatToBillions = (value) => {
    return `${(value / 1000000000).toFixed(2)} B`;
  };

  if (loading) return <div>Loading financial data...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <ResponsivePie
      data={data}
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
        tooltip: {
          container: {
            background: colors.primary[400],
            color: colors.grey[100],
          },
        },
      }}
      margin={{ top: 40, right: 80, bottom: 100, left: 80 }}
      innerRadius={0.5}
      padAngle={0.7}
      cornerRadius={3}
      activeOuterRadiusOffset={8}
      colors={{ datum: 'data.color' }}
      borderColor={{
        from: "color",
        modifiers: [["darker", 0.2]],
      }}
      arcLinkLabelsSkipAngle={10}
      arcLinkLabelsTextColor={colors.grey[100]}
      arcLinkLabelsThickness={2}
      arcLinkLabelsColor={{ from: "color" }}
      enableArcLabels={false}
      arcLabelsRadiusOffset={0.4}
      arcLabelsSkipAngle={7}
      arcLabelsTextColor={{
        from: "color",
        modifiers: [["darker", 2]],
      }}
      tooltip={({ datum }) => (
        <div
          style={{
            padding: "12px",
            background: colors.primary[400],
            color: colors.grey[100],
            border: `1px solid ${colors.grey[400]}`,
            borderRadius: "4px",
          }}
        >
          <strong>{datum.label}:</strong> {formatToBillions(datum.value)} IDR
          <br />
          <small>({((datum.value / data.reduce((sum, item) => sum + item.value, 0)) * 100).toFixed(1)}%)</small>
        </div>
      )}
      legends={[
        {
          anchor: "bottom",
          direction: "row",
          justify: false,
          translateX: 0,
          translateY: 56,
          itemsSpacing: 5,
          itemWidth: 120,
          itemHeight: 18,
          itemTextColor: colors.grey[100],
          itemDirection: "left-to-right",
          itemOpacity: 1,
          symbolSize: 18,
          symbolShape: "circle",
          effects: [
            {
              on: "hover",
              style: {
                itemTextColor: colors.grey[200],
              },
            },
          ],
        },
      ]}
    />
  );
};

export default PieChart;