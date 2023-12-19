import React, { useEffect , useState} from 'react'
import { Chart as ChartJS, defaults } from 'chart.js'
import { Line } from 'react-chartjs-2'
import { io } from 'socket.io-client'
import PropTypes from 'prop-types';

defaults.maintainAspectRatio = false;
defaults.responsive = true;

const SockGraph = ({ sockData }) => {
    const [chartData, setChartData] = useState(null)
    const [chartType, setChartType] = useState('hourly');

    useEffect(() => {
        // const socket = io('http://localhost:5000', {
        const socket = io('https://7kqpyv77j6.execute-api.ap-south-1.amazonaws.com/prod', {
            path: '/socket/',
            // auth: {
            //     token: `${token}` // this is for pushing updated to respected user
            // }
        })

        socket.on('nudgeUpdated', (serverData) => {

            const groupedData = (serverData.data).map(info => {
                return { label: info.labels , aqi: info.aqi }
            })

            if(chartType === 'hourly') handleHourlyData(groupedData);
            else if(chartType === 'daily') handleDailyData(serverData);
            // else if(chartData === 'monthly') handleMontlyData(groupedData);
        })

      socket.on('error', error => console.log(error));
    
      const setFormattedData = () => {
            const groupedData = sockData.data.map(info => {
                return { label: info.labels , aqi: info.aqi }
            })
            const chartData = {
                labels: groupedData.length >= 12 ? groupedData.map(entry => new Date(entry.label).toLocaleString()).slice(-12) : groupedData.map(entry => new Date(entry.label).toLocaleString()),
                datasets: [
                    {
                        label: 'AQI',
                        data: groupedData.length >= 12 ? groupedData.map(entry => entry.aqi).slice(-12) : groupedData.map(entry => entry.aqi),
                        borderColor: 'rgba(75, 192, 192, 1)',
                        backgroundColor: "064FF0",
                        borderWidth: 2,
                        fill: false,
                    }
                ]
            }
            setChartData(chartData);
            setChartType('hourly');
      }
      setFormattedData();

      return () => {
        socket.disconnect();
      }
    }, [])

    const handleHourlyData = (groupedData) => {

        const chartData = {
            labels: groupedData.length >= 12 ? groupedData.map(entry => new Date(entry.labels).toLocaleString()).slice(-12) : groupedData.map(entry => new Date(entry.label).toLocaleString()),
            datasets: [
                {
                    label: 'AQI',
                    data: groupedData.length >= 12 ? groupedData.map(entry => entry.aqi).slice(-12) : groupedData.map(entry => entry.aqi),
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: "064FF0",
                    borderWidth: 2,
                    fill: false,
                }
            ]
        }

        setChartData(chartData);
        setChartType('hourly');
    }

    const handleDailyData = (groupedData) => {
        setChartType('daily');
        console.log(groupedData);

        const labels = groupedData.data.map(entry => new Date(entry.labels).toLocaleDateString());
        const aqiValues = groupedData.data.map(entry => entry.aqi);

        const newGroupedData = labels.reduce((acc, label, index) =>{
            const day = label;
            acc[day] = acc[day] || { sum: 0, count: 0 };
            acc[day].sum += aqiValues[index];
            acc[day].count += 1;
            return acc;
        }, {});

        const averagedData = Object.keys(newGroupedData).map(day => {
            const averageAqi = Math.round(newGroupedData[day].sum /newGroupedData[day].count);
            return { day, averageAqi };
        })

        const chartData = {
            labels: averagedData.length >= 10 ? averagedData.map(entry => entry.day).slice(0, 10) : averagedData.map(entry => entry.day),
            datasets: [
                {
                    label: 'AQI',
                    data: averagedData.map(entry => entry.averageAqi),
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: "064FF0",
                    borderWidth: 2,
                    fill: false,
                }
            ],
        }
        
        setChartData(chartData);
    }


  return (
    <div style={{border: '1px solid white', borderRadius: '1rem', padding: '10px', margin: '10px',height: 'auto', marginBottom: '25px'}}>
        <div className="name-nudge" style={{display:'flex', flexDirection:'column'}}>
            <span>Name: {sockData.name}</span>
            <span>Description: {sockData.description}</span>
            <span>City: {sockData.city.charAt(0).toUpperCase() + sockData.city.slice(1)}</span>
            <span>City: {sockData.state.charAt(0).toUpperCase() + sockData.state.slice(1)}</span>
            <span>Graph: </span>
        </div>

        {chartData && (
            <>
                <div className="graph" style={{height: '400px', marginBottom: '25px'}}>
                    <Line data={chartData}/>
                    <button onClick={() => handleHourlyData(sockData.data)}>Hourly</button>
                    <button onClick={() => handleDailyData(sockData)}>Daily</button>
                    <button onClick={() => handleMontlyData(sockData)}>Montly</button>
                </div>
            </>
        )}
    </div>
  )
}

SockGraph.propTypes = {
    sockData: PropTypes.object.isRequired,
}

export default SockGraph