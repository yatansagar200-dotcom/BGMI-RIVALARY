import { useState, useEffect } from "react"
import api from "../api/axios"

export default function RecentResults() {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchResults()
  }, [])

  const fetchResults = async () => {
    try {
      setLoading(true)
      const res = await api.get("/tournaments/results")
      if (res.data.success) {
        setResults(res.data.data)
      }
    } catch (err) {
      console.error("Error fetching results:", err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <section className="bg-black py-8 px-4">
        <h2 className="text-2xl font-bold text-yellow-400 text-center mb-6">
          Recent Match Results
        </h2>
        <p className="text-center text-gray-400">Loading results...</p>
      </section>
    )
  }

  // Show only last 5 matches
  const recentResults = results.slice(0, 5)

  if (recentResults.length === 0) {
    return (
      <section className="bg-black py-8 px-4">
        <h2 className="text-2xl font-bold text-yellow-400 text-center mb-6">
          Recent Match Results
        </h2>
        <p className="text-center text-gray-400">No results available yet</p>
      </section>
    )
  }

  return (
    <section className="bg-black py-8 px-4">
      <h2 className="text-2xl font-bold text-yellow-400 text-center mb-6">
        Recent Match Results
      </h2>

      <div className="max-w-4xl mx-auto space-y-3">
        {recentResults.map((result) => (
          <div
            key={result._id}
            className="bg-[#020617] border border-gray-700 rounded-lg p-4 hover:border-yellow-500 transition relative"
          >
            {/* Completed Tag */}
            <span className="absolute top-3 right-3 bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full">
              ✓ Completed
            </span>

            <div className="grid md:grid-cols-2 gap-4">
              {/* Tournament Info */}
              <div>
                <h3 className="text-lg font-bold text-yellow-400 mb-2">
                  {result.tournament}
                </h3>
                <div className="text-gray-400 text-xs space-y-1">
                  <p>📅 {result.date} • 🎮 {result.matchType}</p>
                  <p>👥 {result.totalParticipants} • 💰 ₹{result.prizeDistributed}</p>
                </div>
              </div>

              {/* Winners */}
              <div className="flex gap-2">
                {/* 1st Place */}
                <div className="bg-gradient-to-r from-yellow-600 to-yellow-700 p-2 rounded flex-1">
                  <p className="text-[10px] text-yellow-100 uppercase mb-1">🥇 1st</p>
                  <p className="text-sm font-bold text-white truncate">{result.winner}</p>
                  <p className="text-yellow-100 text-xs">₹{result.winnerPrize}</p>
                </div>

                {/* 2nd Place */}
                {result.runnerUp && (
                  <div className="bg-gradient-to-r from-gray-500 to-gray-600 p-2 rounded flex-1">
                    <p className="text-[10px] text-gray-100 uppercase mb-1">🥈 2nd</p>
                    <p className="text-sm font-bold text-white truncate">{result.runnerUp}</p>
                    <p className="text-gray-100 text-xs">₹{result.runnerUpPrize}</p>
                  </div>
                )}

                {/* 3rd Place */}
                {result.thirdPlace && (
                  <div className="bg-gradient-to-r from-orange-600 to-orange-700 p-2 rounded flex-1">
                    <p className="text-[10px] text-orange-100 uppercase mb-1">🥉 3rd</p>
                    <p className="text-sm font-bold text-white truncate">{result.thirdPlace}</p>
                    <p className="text-orange-100 text-xs">₹{result.thirdPrize}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
