import { useState, useEffect } from "react"

export default function AIAnalysis({ process, parameters, results }) {
    const [analysis, setAnalysis] = useState('')
    const [loading, setLoading] = useState(false)
  
    useEffect(() => {
      const generateAnalysis = async () => {
        setLoading(true)
  
        try {
          const response = await fetch('/backend/api', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              process,
              parameters,
              results,
            }),
          })
  
          if (!response.ok) {
            throw new Error('Analysis request failed')
          }
  
          const data = await response.json()
          setAnalysis(data.content)
        } catch (error) {
          console.error('Error generating analysis:', error)
          setAnalysis('Failed to generate analysis. Please try again.')
        } finally {
          setLoading(false)
        }
      }
  
      if (results) {
        generateAnalysis()
      }
    }, [process, parameters, results])
  
    return (
      <div className="mt-4 lg:mt-8 bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-4 lg:p-6">
          <h2 className="text-lg lg:text-xl font-semibold mb-4 text-black border-b pb-2">AI Analysis</h2>
          {loading ? (
            <div className="flex items-center justify-center py-4 lg:py-8">
              <div className="animate-spin rounded-full h-6 w-6 lg:h-8 lg:w-8 border-b-2 border-black"></div>
              <span className="ml-3 text-black font-medium text-sm lg:text-base">Generating analysis...</span>
            </div>
          ) : (
            <div className="prose prose-sm lg:prose max-w-none">
              {analysis.split('\n').map((paragraph, index) => (
                <p key={index} className="mb-2 lg:mb-4 text-sm lg:text-base text-black leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    )
}