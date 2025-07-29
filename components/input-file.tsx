import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function InputFile() {
  return (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Label htmlFor="file">File</Label>
      <small>Max file size: 4 MB</small>
      <Input id="file" type="file" name="file" />
    </div>
  )
}
