import MailList from '@/components/MailList'

export default function MailToCollectPage() {
  return (
    <MailList
      forcedStatus="received"
      title="Courriers à enlever"
      description="Liste des courriers reçus en attente de récupération par leurs destinataires"
    />
  )
}
