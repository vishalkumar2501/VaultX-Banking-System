export function formatCurrency(amount, currency = 'INR') {
  const num = Number(amount || 0)
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2
    }).format(num)
  } catch {
    return `${currency} ${num.toFixed(2)}`
  }
}

export function formatShortDate(dateValue) {
  if (!dateValue) return '—'
  const date = new Date(dateValue)
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

export function formatDateTime(dateValue) {
  if (!dateValue) return '—'
  const date = new Date(dateValue)
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function formatCardNumber(accountId = '', reveal = false) {
  if (!accountId) return '••••  ••••  ••••  0000'
  const clean = accountId.toUpperCase()
  if (reveal) {
    return clean.match(/.{1,4}/g)?.join('  ') || clean
  }
  const tail = clean.slice(-4)
  return `••••  ••••  ••••  ${tail}`
}
