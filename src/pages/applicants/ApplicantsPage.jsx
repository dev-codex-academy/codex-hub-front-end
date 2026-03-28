import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trash2, Check, X, UserSearch, ExternalLink } from 'lucide-react'
import Swal from 'sweetalert2'
import applicantService from '@/services/applicantService'
import { Button } from '@/components/ui/button'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Card, CardContent } from '@/components/ui/card'
import { SpinnerOverlay } from '@/components/ui/spinner'

export default function ApplicantsPage() {
  const navigate = useNavigate()
  const [applicants, setApplicants] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await applicantService.getAll()
      setApplicants(res.data.results ?? res.data)
    } catch {
      //
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleDelete = async (app) => {
    const result = await Swal.fire({
      title: 'Delete applicant?',
      text: `${app.full_name || app.email} will be permanently removed.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Delete',
    })
    if (result.isConfirmed) {
      try {
        await applicantService.remove(app.id)
        fetchData()
      } catch {
        Swal.fire({ icon: 'error', title: 'Error', text: 'Could not delete applicant.', confirmButtonColor: '#4E89BD' })
      }
    }
  }

  const BoolIcon = ({ value }) =>
    value
      ? <Check size={15} style={{color:'#16a34a'}} />
      : <X size={15} style={{color:'#cbd5e1'}} />

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-header-icon icon-blue">
            <UserSearch strokeWidth={2} />
          </div>
          <div>
            <h2 className="page-title">Applicants</h2>
            <p className="page-subtitle">{applicants.length} record{applicants.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>

      <Card>
        <CardContent>
          {loading ? (
            <SpinnerOverlay />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Applicant</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>CV</TableHead>
                  <TableHead>Photo</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applicants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <div className="empty-state">
                        <UserSearch strokeWidth={1.5} />
                        <p className="empty-state-title">No applicants yet</p>
                        <p className="empty-state-desc">Applicants register through the portal and appear here</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  applicants.map((app) => (
                    <TableRow
                      key={app.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/applicants/${app.id}`)}
                    >
                      <TableCell>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {app.photo_url ? (
                            <img src={app.photo_url} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                          ) : (
                            <div style={{
                              width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                              background: 'linear-gradient(135deg, #4E89BD, #61AFEE)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '11px', fontWeight: 700, color: 'white',
                            }}>
                              {`${app.first_name?.[0] ?? ''}${app.last_name?.[0] ?? ''}`.toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p style={{ fontWeight: 600, fontSize: '13.5px' }}>{app.full_name || `${app.first_name} ${app.last_name}`}</p>
                            {app.headline && <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '1px' }}>{app.headline}</p>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{app.email}</TableCell>
                      <TableCell>{app.phone || '—'}</TableCell>
                      <TableCell>{[app.city, app.country].filter(Boolean).join(', ') || '—'}</TableCell>
                      <TableCell><BoolIcon value={app.has_cv} /></TableCell>
                      <TableCell><BoolIcon value={app.has_photo} /></TableCell>
                      <TableCell onClick={e => e.stopPropagation()}>
                        <div className="row-actions">
                          <Button variant="ghost" size="icon" title="View profile" onClick={() => navigate(`/applicants/${app.id}`)}>
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(app)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

    </div>
  )
}
