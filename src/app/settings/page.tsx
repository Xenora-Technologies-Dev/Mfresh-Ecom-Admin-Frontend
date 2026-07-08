"use client";



import { useState } from "react";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";

import { Input, Label } from "@/components/ui/input";

import { settingsApi } from "@/lib/api";

import { BASE_CURRENCY, CURRENCY_OPTIONS } from "@/lib/currency";



export default function SettingsPage() {

  const qc = useQueryClient();

  const { data: settings, isLoading } = useQuery({

    queryKey: ["settings"],

    queryFn: () => settingsApi.list(),

  });



  const [form, setForm] = useState<Record<string, string>>({});



  useQuery({

    queryKey: ["settings-form"],

    queryFn: async () => {

      const s = await settingsApi.list();

      const map: Record<string, string> = {};

      s.forEach((item) => {

        map[item.key as string] = String(item.value ?? "");

      });

      setForm(map);

      return map;

    },

  });



  const save = useMutation({

    mutationFn: () =>

      settingsApi.bulk(

        Object.entries(form).map(([key, value]) => ({ key, value })),

      ),

    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings"] }),

  });



  const fields = [

    { key: "site_name", label: "Site Name" },

    { key: "contact_email", label: "Contact Email" },

    { key: "contact_phone", label: "Contact Phone" },

    { key: "support_address", label: "Support Address" },

    {
      key: "promotional_message",
      label: "Promotional Message",
      hint: "Shown in the top announcement bar on the storefront",
    },

  ];



  const rateFields = [

    { key: "exchange_rate_aed", label: "USD → AED Rate", hint: "1 USD in AED (default: 3.6725)" },

    { key: "exchange_rate_sgd", label: "USD → SGD Rate", hint: "1 USD in SGD (default: 1.345)" },

  ];



  return (

    <div className="mx-auto max-w-2xl space-y-6">

      <div>

        <h2 className="text-2xl font-bold">Settings</h2>

        <p className="text-muted">Global marketplace configuration</p>

      </div>



      <div className="rounded-xl border border-border bg-white p-6 shadow-sm">

        <h3 className="mb-4 font-semibold">Currency</h3>

        <p className="mb-4 text-sm text-muted">

          All product prices are stored in {BASE_CURRENCY}. Exchange rates power AED and SGD

          conversion on the storefront.

        </p>

        <div className="mb-4 flex flex-wrap gap-2">

          {CURRENCY_OPTIONS.map((c) => (

            <span

              key={c.code}

              className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"

            >

              {c.code} — {c.label}

            </span>

          ))}

        </div>

        <div className="space-y-4">

          <div className="space-y-1.5">

            <Label>Default Display Currency</Label>

            <Input value={form.default_currency ?? BASE_CURRENCY} readOnly className="bg-background" />

            <p className="text-xs text-muted">Base currency is fixed to USD for international consistency.</p>

          </div>

          {rateFields.map((f) => (

            <div key={f.key} className="space-y-1.5">

              <Label>{f.label}</Label>

              <Input

                type="number"

                step="0.0001"

                value={form[f.key] ?? ""}

                onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}

                placeholder={f.hint}

              />

            </div>

          ))}

        </div>

      </div>



      <div className="space-y-4 rounded-xl border border-border bg-white p-6 shadow-sm">

        <h3 className="font-semibold">General</h3>

        {isLoading ? (

          <p className="text-muted">Loading...</p>

        ) : (

          fields.map((f) => (

            <div key={f.key} className="space-y-1.5">

              <Label>{f.label}</Label>

              <Input

                value={form[f.key] ?? ""}

                onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}

              />

              {"hint" in f && f.hint ? (
                <p className="text-xs text-muted">{f.hint}</p>
              ) : null}

            </div>

          ))

        )}

        <Button onClick={() => save.mutate()} disabled={save.isPending}>

          {save.isPending ? "Saving..." : "Save Settings"}

        </Button>

      </div>

    </div>

  );

}

