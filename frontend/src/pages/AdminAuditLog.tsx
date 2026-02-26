import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, FileText, Shield } from 'lucide-react'
import { motion } from 'framer-motion'
import { apiService } from '../services/api'
import Alert from '../components/Alert'
import LoadingSpinner from '../components/LoadingSpinner'
import { Card } from '../components/ui/card'

interface AuditEntry {
  id: string
  actor: string
  action: string
  metadata: Record<string, unknown> | null
  createdAt: string
  electionTitle: string | null
}

const AdminAuditLog = () => {
  const [logs, setLogs] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    fetchLogs()
  }, [])

  const fetchLogs = async () => {
    try {
      const res = await apiService.getAuditLog(undefined, 200)
      setLogs((res.data as { logs: AuditEntry[] }).logs)
    } catch {
      setAlert({ type: 'error', message: 'Failed to load audit log' })
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (s: string) =>
    new Date(s).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })

  const actionLabel = (action: string) => {
    const map: Record<string, string> = {
      CREATE_ELECTION: 'Created election',
      UPDATE_ELECTION: 'Updated election',
      DELETE_ELECTION: 'Deleted election',
      UPLOAD_ELIGIBILITY: 'Uploaded eligibility list',
      GENERATE_TOKENS: 'Generated tokens',
      UPDATE_RACE: 'Updated race',
      ADD_CANDIDATE: 'Added candidate',
      UPDATE_CANDIDATE: 'Updated candidate',
      REMOVE_CANDIDATE: 'Removed candidate',
    }
    return map[action] || action
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-10">
      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div>
          <Link
            to="/admin"
            className="inline-flex items-center gap-2 font-mono text-body-sm text-ink/55 hover:text-ink transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2} />
            Back to Dashboard
          </Link>
          <h1 className="font-display text-display-lg font-bold tracking-tighter text-ink mb-2 flex items-center gap-3">
            <Shield className="h-8 w-8 text-ink/60" strokeWidth={2} />
            Audit Log
          </h1>
          <p className="font-mono text-body-sm text-ink/55">
            Platform integrity — all admin actions are logged here
          </p>
        </div>
      </header>

      <Card className="p-6 overflow-hidden">
        <div className="flex items-center gap-2 mb-6">
          <FileText className="h-5 w-5 text-ink/60" strokeWidth={2} />
          <h2 className="font-display text-display-sm font-bold text-ink">Recent Actions</h2>
        </div>
        {logs.length === 0 ? (
          <p className="font-mono text-body-sm text-ink/50 py-12 text-center">
            No audit entries yet
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full font-mono text-body-sm">
              <thead>
                <tr className="border-b border-ink/[0.1]">
                  <th className="text-left py-3 px-4 font-mono text-[0.6875rem] uppercase tracking-wider text-ink/50">
                    When
                  </th>
                  <th className="text-left py-3 px-4 font-mono text-[0.6875rem] uppercase tracking-wider text-ink/50">
                    Actor
                  </th>
                  <th className="text-left py-3 px-4 font-mono text-[0.6875rem] uppercase tracking-wider text-ink/50">
                    Action
                  </th>
                  <th className="text-left py-3 px-4 font-mono text-[0.6875rem] uppercase tracking-wider text-ink/50">
                    Election
                  </th>
                  <th className="text-left py-3 px-4 font-mono text-[0.6875rem] uppercase tracking-wider text-ink/50">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => (
                  <motion.tr
                    key={log.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.02 * i }}
                    className="border-b border-ink/[0.06] hover:bg-ink/[0.02]"
                  >
                    <td className="py-3 px-4 text-ink/60 whitespace-nowrap">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="py-3 px-4 text-ink/80">{log.actor}</td>
                    <td className="py-3 px-4 text-ink font-medium">
                      {actionLabel(log.action)}
                    </td>
                    <td className="py-3 px-4 text-ink/60">
                      {log.electionTitle || '—'}
                    </td>
                    <td className="py-3 px-4 text-ink/50 text-[0.6875rem]">
                      {log.metadata && typeof log.metadata === 'object'
                        ? JSON.stringify(log.metadata).slice(0, 80) + (JSON.stringify(log.metadata).length > 80 ? '…' : '')
                        : '—'}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

export default AdminAuditLog
