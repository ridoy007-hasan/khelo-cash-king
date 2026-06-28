import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar'

const SECTIONS = [
  {
    title: 'Eligibility',
    points: [
      'You must be 18 years or older to play and deposit real money.',
      'One account per person. Multiple accounts will be banned and balances forfeited.',
    ],
  },
  {
    title: 'Joining a Match',
    points: [
      'Entry fee is deducted immediately when you confirm your join.',
      'You must enter your correct Free Fire In-Game Name (IGN) when joining — incorrect names may result in disqualification.',
      'Room ID and password are revealed 15 minutes before the match starts, under My Matches.',
    ],
  },
  {
    title: 'Prizes & Verification',
    points: [
      'Kills and placements are verified manually by admins using in-game results and screenshots.',
      'Prizes are credited to your wallet within a few hours after the match ends.',
      'Any player found cheating, teaming, or using unauthorized software forfeits all prizes.',
    ],
  },
  {
    title: 'Wallet & Withdrawals',
    points: [
      'Deposits are reviewed manually — your balance updates only after admin approval, typically within 30 minutes.',
      'Minimum withdrawal amount is ৳50.',
      'Withdrawals are sent to the bKash/Nagad number you provide — double check before submitting.',
    ],
  },
  {
    title: 'Cancellations & Refunds',
    points: [
      'If a match is cancelled by admin, all entry fees are refunded to participants\' wallets automatically.',
      'No refunds for voluntary no-shows after the room is revealed.',
    ],
  },
]

export default function RulesPage() {
  const navigate = useNavigate()
  return (
    <div>
      <TopBar title="All Rules" subtitle="Please read carefully" showWallet={false} onBack={() => navigate(-1)} />
      <div className="px-5 pb-8 space-y-4">
        {SECTIONS.map((s) => (
          <div key={s.title} className="glass rounded-2xl p-4">
            <h3 className="font-bold mb-2">{s.title}</h3>
            <ul className="space-y-1.5">
              {s.points.map((p, i) => (
                <li key={i} className="text-sm text-mist flex gap-2">
                  <span className="text-brand-blue">•</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
