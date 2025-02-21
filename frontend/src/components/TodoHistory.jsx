import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL.replace(/\/$/, "");

function TodoHistory() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API_BASE_URL}/todos/${id}/history`)
      .then((res) => {
        const groupedHistory = groupByTimestampAndReason(res.data);
        setHistory(groupedHistory);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching history:", err);
        alert("Error loading todo history.");
      });
  }, [id]);

  const groupByTimestampAndReason = (historyData) => {
    const grouped = {};
    historyData.forEach(entry => {
      const key = `${entry.changed_at} | ${entry.reason}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(entry);
    });
    return Object.entries(grouped);
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <button onClick={() => navigate(-1)} className="logout-btn" style={{ position: "absolute", top: "10px", left: "10px", width: "5%" }} >← Back</button>
      <div className="history-container">
        <h2 className="history-title">Todo History</h2>
        <div style={{ overflowX: "auto" }}> {/* Allow horizontal scroll if necessary */}
          <table className="history-table" style={{  }}>
            <thead>
              <tr>
                <th style={{ width: "100px", whiteSpace: "nowrap" }}>Changed At</th>
                <th style={{ width: "50px" }}>Reason</th>
                <th style={{ width: "40px" }}>Field</th>
                <th style={{ width: "100px" }}>Old Value</th>
                <th style={{ width: "200px" }}>New Value</th>
              </tr>
            </thead>
            <tbody>
              {history.map(([groupKey, changes], index) => {
                const [timestamp, reason] = groupKey.split(" | ");
                return changes.map((entry, idx) => (
                  <tr key={`${index}-${idx}`}>
                    {idx === 0 && (
                      <>
                        <td style={{ whiteSpace: "nowrap" }}>{timestamp}</td>
                        <td>{reason}</td>
                      </>
                    )}
                    {idx !== 0 && (
                      <>
                        <td></td>
                        <td></td>
                      </>
                    )}
                    <td>{entry.field_changed}</td>
                    <td>{entry.old_value}</td>
                    <td>{entry.new_value}</td>
                  </tr>
                ));
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default TodoHistory;
