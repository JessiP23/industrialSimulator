import { useRef, useEffect } from "react"
import { Chart } from 'chart.js/auto'


export default function ResultsChart({ results }) {
    const chartRef = useRef(null)
    const chartInstanceRef = useRef(null)
  
    useEffect(() => {
      if (!chartRef.current || !results) return
  
      const ctx = chartRef.current.getContext('2d')
      const labels = Object.keys(results)
      const data = Object.values(results)
  
      const chartConfig = {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Simulation Results',
            data: data,
            backgroundColor: [
              'rgba(59, 130, 246, 0.6)',
              'rgba(16, 185, 129, 0.6)',
              'rgba(249, 115, 22, 0.6)',
              'rgba(236, 72, 153, 0.6)',
            ],
            borderColor: [
              'rgba(59, 130, 246, 1)',
              'rgba(16, 185, 129, 1)',
              'rgba(249, 115, 22, 1)',
              'rgba(236, 72, 153, 1)',
            ],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      }
  
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy()
      }
  
      chartInstanceRef.current = new Chart(ctx, chartConfig)
  
      return () => {
        if (chartInstanceRef.current) {
          chartInstanceRef.current.destroy()
        }
      }
    }, [results])
  
    return (
      <div className="h-[200px] lg:h-[300px] w-full">
        <canvas ref={chartRef}></canvas>
      </div>
    )
}