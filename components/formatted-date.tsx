"use client"
import dynamic from 'next/dynamic'
import ReactTimeAgo from 'react-time-ago'
import TimeAgo from 'javascript-time-ago'
import en from 'javascript-time-ago/locale/en'

TimeAgo.addDefaultLocale(en)

interface FormattedDateProps {
  date: string
}

// Componente interno que maneja la lógica de formateo de fecha
function FormattedDateInternal({ date }: FormattedDateProps) {
  // Validate input
  if (!date || date.trim() === "") {
    return null;
  }
  
  // Asegurarse de que la fecha se interprete correctamente en UTC
  let dateObj;
  try {
    // Si la fecha ya tiene 'Z' al final, ya está en formato ISO UTC
    if (date.endsWith('Z')) {
      dateObj = new Date(date);
    } else {
      // Intentar parsear la fecha asumiendo que está en formato ISO sin la 'Z'
      dateObj = new Date(date + 'Z');
    }
    
    // Si la fecha sigue siendo inválida, intentar con Date.parse
    if (isNaN(dateObj.getTime())) {
      const timestamp = Date.parse(date);
      if (!isNaN(timestamp)) {
        dateObj = new Date(timestamp);
      } else {
        return null; // Fecha inválida
      }
    }
  } catch (error) {
    console.error("Error parsing date:", error);
    return null;
  }
  
  // Return null if the date is still invalid
  if (isNaN(dateObj.getTime())) {
    return null;
  }
  
  const now = new Date();
  const diffTime = now.getTime() - dateObj.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  
  // If the difference is 365 days or less, return relative time using react-time-ago
  if (diffDays <= 365) {
    return <ReactTimeAgo date={dateObj} locale="en" />;
  } else {
    // Otherwise, format the date normally using UTC methods to evitar problemas de zona horaria
    const pad = (num: number) => num.toString().padStart(2, "0");
    const year = dateObj.getUTCFullYear();
    const month = pad(dateObj.getUTCMonth() + 1);
    const day = pad(dateObj.getUTCDate());
    const hours = pad(dateObj.getUTCHours());
    const minutes = pad(dateObj.getUTCMinutes());
    const seconds = pad(dateObj.getUTCSeconds());
    return <time className='text-nowrap'>{`${year}-${month}-${day} ${hours}:${minutes}:${seconds}`}</time>;
  }
}

// Exportamos el componente con dynamic para asegurar que solo se renderice en el cliente
export const FormattedDate = dynamic(() => Promise.resolve(FormattedDateInternal), {
  ssr: false,
}) as typeof FormattedDateInternal;