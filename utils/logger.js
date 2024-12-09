export function logWithTimestamp(message, error) {
  const timestamp = new Date().toISOString(); // Ottiene la data e ora in formato ISO

  console.log(`[${timestamp}] ${message} ${error ? `: ${error}` : ''}`);
}
