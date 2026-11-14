import useLocale from '../useLocale'
import { HeartFilledIcon, HeartIcon } from '@radix-ui/react-icons'
import './lives.css'

export default function Lives({ remaining, total, label }) {
  const { ui } = useLocale()
  return <div className="life-bar life-hearts" role="img" aria-label={ui(label)}>
    {Array.from({ length: total }, (_, index) => {
      const alive = index < remaining
      const Icon = alive ? HeartFilledIcon : HeartIcon
      return <Icon key={index} className={alive ? 'life-heart alive' : 'life-heart'} width={22} height={22} aria-hidden="true" />
    })}
  </div>
}
