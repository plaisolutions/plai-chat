import { useState } from "react"

import { MinusCircle, PlusCircle } from "lucide-react"
import { Input } from "./ui/input"
import { Button } from "./ui/button"

interface RepeatableInputFieldProps {
  name: string
  defaultValues?: string[]
  placeholder?: string
}

export default function RepeatableInputField({
  name,
  placeholder,
  defaultValues,
}: RepeatableInputFieldProps) {
  const [values, setValues] = useState(defaultValues || [""])

  const handleInputChange = (
    index: number,
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const newValues = [...values]
    newValues[index] = event.target.value
    setValues(newValues)
  }

  function handleAddField() {
    setValues([...values, ""])
  }

  function handleRemoveField(index: number) {
    const newValues = [...values]
    newValues.splice(index, 1)
    setValues(newValues)
  }

  return (
    <div>
      <input type="hidden" name={name} value={values} />
      {values.map((value, index) => (
        <div
          key={index}
          className="mb-4 grid w-full grid-cols-8 items-center gap-1.5"
        >
          <Input
            className="col-span-7"
            type="text"
            name={`${name}[${index}]`}
            id={name}
            placeholder={placeholder}
            value={value}
            onChange={(e) => handleInputChange(index, e)}
            required
          />
          <button
            type="button"
            onClick={() => handleRemoveField(index)}
            className="col-span-1"
          >
            <MinusCircle className="size-5" />
          </button>
        </div>
      ))}
      <Button
        type="button"
        className="flex items-center gap-2"
        variant="outline"
        size="sm"
        onClick={handleAddField}
      >
        Add new <PlusCircle className="size-5" />
      </Button>
    </div>
  )
}
