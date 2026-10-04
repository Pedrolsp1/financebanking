import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

export type Field = {
  key: string;
  label: string;
  type: "text" | "number" | "date" | "select" | "switch";
  options?: readonly string[];
};

type Props = {
  title: string;
  fields: Field[];
  record: Record<string, unknown>;
  onSave: (values: Record<string, unknown>) => void;
  onDelete?: () => void;
};

export function RowActions({ title, fields, record, onSave, onDelete }: Props) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Record<string, unknown>>(record);

  const openEdit = () => {
    setValues(record);
    setOpen(true);
  };

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const out: Record<string, unknown> = {};
    for (const f of fields) {
      const v = values[f.key];
      out[f.key] = f.type === "number" ? Number(v) || 0 : v;
    }
    onSave(out);
    setOpen(false);
    toast.success("Alterações salvas");
  };

  return (
    <div className="flex justify-end gap-1">
      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={openEdit} aria-label="Editar">
        <Pencil className="h-4 w-4" />
      </Button>
      {onDelete && (
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-destructive hover:text-destructive"
          aria-label="Excluir"
          onClick={() => {
            onDelete();
            toast("Item excluído");
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <form className="flex flex-col gap-4" onSubmit={save}>
            {fields.map((f) => (
              <div key={f.key} className="flex flex-col gap-2">
                <Label>{f.label}</Label>
                {f.type === "select" ? (
                  <Select
                    value={String(values[f.key])}
                    onValueChange={(v) => setValues((p) => ({ ...p, [f.key]: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {f.options?.map((o) => (
                        <SelectItem key={o} value={o}>
                          {o}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : f.type === "switch" ? (
                  <Switch
                    checked={Boolean(values[f.key])}
                    onCheckedChange={(v) => setValues((p) => ({ ...p, [f.key]: v }))}
                  />
                ) : (
                  <Input
                    type={f.type}
                    value={String(values[f.key] ?? "")}
                    onChange={(e) => setValues((p) => ({ ...p, [f.key]: e.target.value }))}
                  />
                )}
              </div>
            ))}
            <DialogFooter>
              <Button type="submit">Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
