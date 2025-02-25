import { useTheme } from "@mui/material";
import { ResponsiveBar } from "@nivo/bar";
import { tokens } from "../theme";
import { useState, useEffect } from "react";

const BarChart = ({ isDashboard = false }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/team/team-count")
      .then((res) => res.json())
      .then((data) => {
        const formattedData = data.map((item) => ({
          country: item.name,
          count: parseInt(item.count, 10),
        }));
        setData(formattedData);
      })
      .catch((err) => console.error("Error fetching data:", err));
  }, []);

  return (
<ResponsiveBar
  data={data}
  keys={["count"]}
  indexBy="country"
  margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
  padding={0.3}
  valueScale={{ type: "linear" }}
  indexScale={{ type: "band", round: true }}
  colors={(bar) => {
    const colorScheme = ["#ff6b6b", "#feca57", "#48dbfb", "#1dd1a1", "#5f27cd", "#ee5253"];
    return colorScheme[bar.index % colorScheme.length]; // Warna berputar sesuai indeks
  }}
  borderColor={{ from: "color", modifiers: [["darker", "1.6"]] }}
  axisBottom={{
    tickSize: 5,
    tickPadding: 5,
    tickRotation: 0,
    legend: isDashboard ? undefined : "Name",
    legendPosition: "middle",
    legendOffset: 32,
  }}
  axisLeft={{
    tickSize: 5,
    tickPadding: 5,
    tickRotation: 0,
    legend: isDashboard ? undefined : "Count",
    legendPosition: "middle",
    legendOffset: -40,
  }}
  enableLabel={false}
  legends={[
    {
      dataFrom: "keys",
      anchor: "bottom-right",
      direction: "column",
      translateX: 120,
      itemsSpacing: 2,
      itemWidth: 100,
      itemHeight: 20,
      itemDirection: "left-to-right",
      itemOpacity: 0.85,
      symbolSize: 20,
      effects: [{ on: "hover", style: { itemOpacity: 1 } }],
    },
  ]}
  role="application"
  barAriaLabel={(e) =>
    `${e.id}: ${e.formattedValue} occurrences of name: ${e.indexValue}`
  }
/>
  );
};

export default BarChart;
