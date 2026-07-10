"use client";

import { Input, Label, Textarea } from "@/components/ui/input";

export type ProductSpecs = Record<string, string>;

const SECTIONS: {
  title: string;
  fields: { key: string; label: string; placeholder?: string; multiline?: boolean }[];
}[] = [
  {
    title: "Product Details",
    fields: [
      { key: "varietyName", label: "Variety Name", placeholder: "e.g. Standard White" },
      { key: "productCode", label: "Product Code", placeholder: "e.g. FV00438" },
      { key: "cultivationType", label: "Cultivation Type", placeholder: "e.g. Processed" },
      { key: "grade", label: "Grade", placeholder: "e.g. A" },
      { key: "shelfLife", label: "Shelf Life", placeholder: "e.g. 90 days" },
    ],
  },
  {
    title: "About the Variety",
    fields: [
      {
        key: "aboutVariety",
        label: "About the Variety",
        placeholder: "Short description of the variety",
        multiline: true,
      },
    ],
  },
  {
    title: "Stock Dimensions",
    fields: [
      { key: "packagingType", label: "Packaging Type", placeholder: "e.g. Carton" },
      { key: "packagingWeight", label: "Packaging Weight", placeholder: "e.g. 19.44" },
      { key: "unitsPerPackaging", label: "Units per Packaging", placeholder: "e.g. 360" },
      { key: "packagingPerTon", label: "Packaging Qty per Ton", placeholder: "e.g. 51.4" },
      {
        key: "packagingPerContainer",
        label: "Packaging Qty per Container",
        placeholder: "e.g. 1312",
      },
    ],
  },
  {
    title: "Quick Details",
    fields: [
      { key: "pricePerKg", label: "Price per Kg", placeholder: "e.g. 2.2" },
      { key: "pricePerPackaging", label: "Price per Packaging", placeholder: "e.g. 37.97" },
      { key: "sellingRange", label: "Selling Range", placeholder: "e.g. Core" },
      { key: "storage", label: "Storage", placeholder: "e.g. CHILLED" },
      { key: "temperature", label: "Temperature", placeholder: "e.g. CHILLED" },
      { key: "halalStatus", label: "Halal Status", placeholder: "Yes / No" },
      { key: "hasTechSpecSheet", label: "Tech Spec Sheet", placeholder: "Yes / No" },
    ],
  },
  {
    title: "Shipping Information",
    fields: [
      { key: "shippingFrom", label: "Shipping From", placeholder: "e.g. India" },
      { key: "shippingMode", label: "Shipping Mode", placeholder: "e.g. SHIP" },
      { key: "port", label: "Port", placeholder: "e.g. Cochin" },
      { key: "containerType", label: "Container Type", placeholder: "e.g. Reefer" },
      { key: "incoterm", label: "INCOTERM", placeholder: "e.g. DDP" },
      { key: "leadTimeDays", label: "Lead Time (days)", placeholder: "e.g. 21" },
    ],
  },
  {
    title: "Additional Information",
    fields: [
      { key: "hsCode", label: "HS Code", placeholder: "e.g. 04072100" },
      { key: "storageTemperature", label: "Storage Temperature", placeholder: "e.g. 4°C" },
      {
        key: "transportTemperature",
        label: "Transportation Temperature",
        placeholder: "e.g. 1°C",
      },
      { key: "productType", label: "Product Type", placeholder: "e.g. Non-DG" },
    ],
  },
];

interface ProductSpecsFormProps {
  value: ProductSpecs;
  onChange: (specs: ProductSpecs) => void;
}

export function ProductSpecsForm({ value, onChange }: ProductSpecsFormProps) {
  const setField = (key: string, fieldValue: string) => {
    const next = { ...value };
    if (!fieldValue.trim()) delete next[key];
    else next[key] = fieldValue;
    onChange(next);
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted">
        These fields appear on the product detail page (Product Details, Stock,
        Shipping, etc.). Leave blank to hide a field.
      </p>
      {SECTIONS.map((section) => (
        <div key={section.title} className="space-y-3 rounded-lg border border-border p-4">
          <h4 className="font-semibold text-dark-gray">{section.title}</h4>
          <div className="grid gap-3 sm:grid-cols-2">
            {section.fields.map((field) => (
              <div
                key={field.key}
                className={
                  field.multiline ? "space-y-1.5 sm:col-span-2" : "space-y-1.5"
                }
              >
                <Label>{field.label}</Label>
                {field.multiline ? (
                  <Textarea
                    value={value[field.key] ?? ""}
                    placeholder={field.placeholder}
                    onChange={(e) => setField(field.key, e.target.value)}
                    rows={3}
                  />
                ) : (
                  <Input
                    value={value[field.key] ?? ""}
                    placeholder={field.placeholder}
                    onChange={(e) => setField(field.key, e.target.value)}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
