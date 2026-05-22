'use client'

export function BackButton() {
  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    if (document.referrer) {
      e.preventDefault()
      history.back()
    }
  }
  return <a href="/" onClick={handleClick}>← Back</a>
}
