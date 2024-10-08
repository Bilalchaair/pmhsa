import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto'; // Automatically register chart.js


function App() {
    const [patients, setPatients] = useState([]);
    const [patientHistory, setPatientHistory] = useState({}); // To store last 10 data points for each patient
    const [selectedPatient, setSelectedPatient] = useState(null); // To store the selected patient
    const [alert, setAlert] = useState(null); // To store alert messages

    // Define thresholds for abnormal levels
    const thresholds = {
        temperature: { min: 36.0, max: 37.5 },
        heart_rate: { min: 60, max: 100 },
        blood_pressure: { systolic_max: 140, diastolic_max: 90 },
        oxygen: { min: 95 },
        humidity: { min: 30, max: 70 },
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('http://127.0.0.1:5000/data');
                const data = await response.json();

                // Keep track of the last 10 data points for each patient
                setPatientHistory((prevHistory) => {
                    const updatedHistory = { ...prevHistory };

                    data.forEach(patient => {
                        if (!updatedHistory[patient.id]) {
                            updatedHistory[patient.id] = {
                                temperature: [],
                                heart_rate: [],
                                blood_pressure: [],
                                humidity: [],
                                oxygen: []
                            };
                        }

                        // Update history and keep only last 10 values
                        updatedHistory[patient.id].temperature = [
                            ...updatedHistory[patient.id].temperature.slice(-9),
                            patient.temperature
                        ];
                        updatedHistory[patient.id].heart_rate = [
                            ...updatedHistory[patient.id].heart_rate.slice(-9),
                            patient.heart_rate
                        ];
                        updatedHistory[patient.id].blood_pressure = [
                            ...updatedHistory[patient.id].blood_pressure.slice(-9),
                            patient.blood_pressure
                        ];
                        updatedHistory[patient.id].humidity = [
                            ...updatedHistory[patient.id].humidity.slice(-9),
                            patient.humidity
                        ];
                        updatedHistory[patient.id].oxygen = [
                            ...updatedHistory[patient.id].oxygen.slice(-9),
                            patient.oxygen
                        ];

                        // Check if data is abnormal
                        checkForAlerts(patient);
                    });

                    return updatedHistory;
                });

                setPatients(data);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        const interval = setInterval(fetchData, 1000); // Fetch data every second

        return () => clearInterval(interval); // Cleanup on unmount
    }, []);

    // Function to check if the patient's data is abnormal and specify which vitals are abnormal
    const checkForAlerts = (patient) => {
        const { temperature, heart_rate, blood_pressure, oxygen, humidity } = patient;
        const systolic = parseInt(blood_pressure.split('/')[0]);
        const diastolic = parseInt(blood_pressure.split('/')[1]);
        let alertMessage = `Alert for Patient ${patient.id}: `;

        // Check each vital sign and add to alert message if abnormal
        let hasAbnormalData = false;
        if (temperature < thresholds.temperature.min || temperature > thresholds.temperature.max) {
            alertMessage += `Temperature ${temperature}°C is abnormal. `;
            hasAbnormalData = true;
        }
        if (heart_rate < thresholds.heart_rate.min || heart_rate > thresholds.heart_rate.max) {
            alertMessage += `Heart Rate ${heart_rate} bpm is abnormal. `;
            hasAbnormalData = true;
        }
        if (systolic > thresholds.blood_pressure.systolic_max || diastolic > thresholds.blood_pressure.diastolic_max) {
            alertMessage += `Blood Pressure ${blood_pressure} is abnormal. `;
            hasAbnormalData = true;
        }
        if (oxygen < thresholds.oxygen.min) {
            alertMessage += `Oxygen Level ${oxygen}% is abnormal. `;
            hasAbnormalData = true;
        }
        if (humidity < thresholds.humidity.min || humidity > thresholds.humidity.max) {
            alertMessage += `Humidity ${humidity}% is abnormal. `;
            hasAbnormalData = true;
        }

        // Set alert if there is any abnormal data
        if (hasAbnormalData) {
            setAlert(alertMessage);
        } else {
            setAlert(null); // Reset alert if data is normal
        }
    };

    // Helper function to generate chart data
    const generateChartData = (label, data) => ({
        labels: [...Array(data.length).keys()], // Generate labels 0, 1, 2, ..., 9
        datasets: [
            {
                label,
                data,
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                fill: true,
            }
        ]
    });

    return (
        <div className="container">
            <h1>Patient Monitoring System</h1>
    
            {alert && <div className="alert">{alert}</div>}
    
            <div className="app-layout">
                {/* Patient List */}
                <div className="patient-list">
                    <h2>Patients</h2>
                    <ul>
                        {patients.map((patient) => (
                            <li
                                key={patient.id}
                                onClick={() => setSelectedPatient(patient.id)}
                                className={selectedPatient === patient.id ? 'selected' : ''}
                            >
                                Patient {patient.id}
                            </li>
                        ))}
                    </ul>
                </div>
    
                {/* Patient Data and Charts */}
                <div className="patient-data">
                    {selectedPatient ? (
                        <div>
                            <h2>Patient {selectedPatient} Data</h2>
                            {patientHistory[selectedPatient] && (
                                <div>
                                    <div className="vital-signs">
                                        <div className="vital-sign">
                                            <h4>Temperature</h4>
                                            <div className="value">{patientHistory[selectedPatient].temperature.slice(-1)[0]}°C</div>
                                        </div>
                                        <div className="vital-sign">
                                            <h4>Heart Rate</h4>
                                            <div className="value">{patientHistory[selectedPatient].heart_rate.slice(-1)[0]} bpm</div>
                                        </div>
                                        <div className="vital-sign">
                                            <h4>Blood Pressure</h4>
                                            <div className="value">{patientHistory[selectedPatient].blood_pressure.slice(-1)[0]}</div>
                                        </div>
                                        <div className="vital-sign">
                                            <h4>Humidity</h4>
                                            <div className="value">{patientHistory[selectedPatient].humidity.slice(-1)[0]}%</div>
                                        </div>
                                        <div className="vital-sign">
                                            <h4>Oxygen</h4>
                                            <div className="value">{patientHistory[selectedPatient].oxygen.slice(-1)[0]}%</div>
                                        </div>
                                    </div>
    
                                    {/* Charts */}
                                    <div className="charts-container">
                                        {/* Temperature Chart */}
                                        <div className="chart">
                                            <h3>Temperature</h3>
                                            <Line data={generateChartData('Temperature', patientHistory[selectedPatient].temperature)} />
                                        </div>
    
                                        {/* Heart Rate Chart */}
                                        <div className="chart">
                                            <h3>Heart Rate</h3>
                                            <Line data={generateChartData('Heart Rate', patientHistory[selectedPatient].heart_rate)} />
                                        </div>
    
                                        {/* Blood Pressure Chart */}
                                        <div className="chart">
                                            <h3>Blood Pressure</h3>
                                            <Line
                                                data={generateChartData(
                                                    'Blood Pressure',
                                                    patientHistory[selectedPatient].blood_pressure.map(bp => parseInt(bp.split('/')[0]))
                                                )}
                                            />
                                        </div>
    
                                        {/* Humidity Chart */}
                                        <div className="chart">
                                            <h3>Humidity</h3>
                                            <Line data={generateChartData('Humidity', patientHistory[selectedPatient].humidity)} />
                                        </div>
    
                                        {/* Oxygen Chart */}
                                        <div className="chart">
                                            <h3>Oxygen</h3>
                                            <Line data={generateChartData('Oxygen', patientHistory[selectedPatient].oxygen)} />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <p>Please select a patient to view their data.</p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default App;
