import {
  Document,
  Line,
  Page,
  Path,
  pdf,
  Rect,
  StyleSheet,
  Svg,
  Text,
  View,
} from "@react-pdf/renderer";
import type { Statistics } from "./statistics";

/*
 * Le rapport d'activité en PDF, construit dans le navigateur à partir des mêmes statistiques que
 * la section du tableau de bord. Les graphiques sont dessinés en vectoriel (rectangles et
 * tracés), avec la palette validée du mode clair : le rapport se lit et s'imprime sur papier.
 * Ce module n'est chargé qu'au clic sur « Rapport PDF ».
 */

const INK = "#161616";
const MUTED = "#5e5e5e";
const BORDER = "#e3e3e3";
const GRID = "#ececec";
const BLUE = "#1860a0";
const SERIES = ["#2a78d6", "#eb6834", "#1baf7a"];
const STATUS = {
  good: "#0ca30c",
  warning: "#fab219",
  serious: "#ec835a",
  critical: "#d03b3b",
};
const HEAT = ["#f1f1f1", "#cde2fb", "#86b6ef", "#3987e5", "#256abf", "#104281"];
/** Largeur utile d'une page A4 avec 40 points de marge de chaque côté. */
const WIDTH = 515;

const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 56,
    paddingHorizontal: 40,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: INK,
  },
  brand: { fontFamily: "Courier-Bold", fontSize: 16, color: BLUE },
  muted: { color: MUTED },
  title: { fontFamily: "Helvetica-Bold", fontSize: 22, marginTop: 18 },
  section: {
    fontFamily: "Helvetica-Bold",
    fontSize: 13,
    marginTop: 18,
    marginBottom: 8,
  },
  card: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 6,
    padding: 12,
    marginBottom: 12,
  },
  cardTitle: { fontFamily: "Helvetica-Bold", fontSize: 10.5, marginBottom: 2 },
  row: { flexDirection: "row" },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: MUTED,
  },
  th: { fontFamily: "Helvetica-Bold", fontSize: 8, color: MUTED },
  cell: { paddingVertical: 4 },
});

/** Les nombres à la française, avec une espace simple (la police du PDF n'a pas l'espace fine). */
const fmt = (value: number) =>
  Math.round(value).toLocaleString("fr-FR").replace(/[  ]/g, " ");

const dayLabel = (date: string) =>
  new Date(`${date}T12:00:00`).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });

const longDate = (date: string) =>
  new Date(`${date}T12:00:00`).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

function change(current: number, previous: number): string {
  if (previous === 0) return current === 0 ? "stable" : "nouveau";
  const percent = Math.round(((current - previous) / previous) * 100);
  return percent === 0 ? "stable" : `${percent > 0 ? "+" : ""}${percent} %`;
}

/** Un maximum d'axe « rond » (1, 2 ou 5 × 10^n) au-dessus de la plus grande valeur. */
function niceMax(value: number): number {
  if (value <= 0) return 1;
  const power = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 5, 10].find((candidate) => candidate * power >= value);
  return (step ?? 10) * power;
}

function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <View style={[styles.row, { marginTop: 4, marginBottom: 6 }]}>
      {items.map((item) => (
        <View
          key={item.label}
          style={[styles.row, { alignItems: "center", marginRight: 12 }]}
        >
          <View
            style={{
              width: 7,
              height: 7,
              borderRadius: 1.5,
              backgroundColor: item.color,
              marginRight: 4,
            }}
          />
          <Text style={styles.muted}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

/** Colonnes par jour, empilées quand il y a plusieurs séries, avec une grille légère. */
function Columns({
  data,
  keys,
  colors,
  width = WIDTH - 26,
  height = 120,
}: {
  data: Record<string, number | string>[];
  keys: string[];
  colors: string[];
  width?: number;
  height?: number;
}) {
  const totals = data.map((point) =>
    keys.reduce((sum, key) => sum + Number(point[key] ?? 0), 0),
  );
  const max = niceMax(Math.max(...totals, 0));
  const slot = width / Math.max(data.length, 1);
  const bar = Math.min(12, slot * 0.7);
  const first = data[0]?.date;
  const middle = data[Math.floor(data.length / 2)]?.date;
  const last = data.at(-1)?.date;
  return (
    <View>
      <View style={styles.row}>
        <View
          style={{
            width: 26,
            height,
            justifyContent: "space-between",
            alignItems: "flex-end",
            paddingRight: 4,
          }}
        >
          <Text style={[styles.muted, { fontSize: 7 }]}>{fmt(max)}</Text>
          <Text style={[styles.muted, { fontSize: 7 }]}>{fmt(max / 2)}</Text>
          <Text style={[styles.muted, { fontSize: 7 }]}>0</Text>
        </View>
        <Svg width={width} height={height}>
          {[0, 0.5, 1].map((ratio) => (
            <Line
              key={ratio}
              x1={0}
              x2={width}
              y1={height * ratio}
              y2={height * ratio}
              stroke={GRID}
              strokeWidth={0.7}
            />
          ))}
          {data.map((point, index) => {
            let base = height;
            return keys.map((key, keyIndex) => {
              const value = Number(point[key] ?? 0);
              if (value === 0) return null;
              const size = (value / max) * height;
              base -= size;
              return (
                <Rect
                  key={`${String(point.date)}-${key}`}
                  x={index * slot + (slot - bar) / 2}
                  y={base}
                  width={bar}
                  // Un écart d'un point sépare les segments empilés.
                  height={Math.max(size - (keyIndex > 0 ? 0.8 : 0), 0.5)}
                  fill={colors[keyIndex]}
                />
              );
            });
          })}
        </Svg>
      </View>
      <View
        style={[
          styles.row,
          { marginLeft: 26, justifyContent: "space-between", marginTop: 3 },
        ]}
      >
        {[first, middle, last].map((date, index) => (
          <Text
            // biome-ignore lint/suspicious/noArrayIndexKey: trois repères fixes (début, milieu, fin).
            key={index}
            style={[styles.muted, { fontSize: 7 }]}
          >
            {date ? dayLabel(String(date)) : ""}
          </Text>
        ))}
      </View>
    </View>
  );
}

/** Une seule grandeur par jour, en aire légère sous une ligne. */
function AreaLine({
  data,
  dataKey,
  width = WIDTH - 26,
  height = 110,
}: {
  data: Record<string, number | string>[];
  dataKey: string;
  width?: number;
  height?: number;
}) {
  const values = data.map((point) => Number(point[dataKey] ?? 0));
  const max = niceMax(Math.max(...values, 0));
  const x = (index: number) =>
    values.length > 1 ? (index / (values.length - 1)) * width : width / 2;
  const y = (value: number) => height - (value / max) * height;
  const line = values
    .map((value, index) => `${index === 0 ? "M" : "L"}${x(index)},${y(value)}`)
    .join(" ");
  return (
    <View>
      <View style={styles.row}>
        <View
          style={{
            width: 26,
            height,
            justifyContent: "space-between",
            alignItems: "flex-end",
            paddingRight: 4,
          }}
        >
          <Text style={[styles.muted, { fontSize: 7 }]}>{fmt(max)}</Text>
          <Text style={[styles.muted, { fontSize: 7 }]}>0</Text>
        </View>
        <Svg width={width} height={height}>
          {[0, 0.5, 1].map((ratio) => (
            <Line
              key={ratio}
              x1={0}
              x2={width}
              y1={height * ratio}
              y2={height * ratio}
              stroke={GRID}
              strokeWidth={0.7}
            />
          ))}
          <Path
            d={`${line} L${x(values.length - 1)},${height} L${x(0)},${height} Z`}
            fill={SERIES[0]}
            fillOpacity={0.1}
          />
          <Path d={line} stroke={SERIES[0]} strokeWidth={1.5} fill="none" />
        </Svg>
      </View>
      <View
        style={[
          styles.row,
          { marginLeft: 26, justifyContent: "space-between", marginTop: 3 },
        ]}
      >
        <Text style={[styles.muted, { fontSize: 7 }]}>
          {data[0] ? dayLabel(String(data[0].date)) : ""}
        </Text>
        <Text style={[styles.muted, { fontSize: 7 }]}>
          {data.at(-1) ? dayLabel(String(data.at(-1)?.date)) : ""}
        </Text>
      </View>
    </View>
  );
}

const WEEKDAYS = ["lun.", "mar.", "mer.", "jeu.", "ven.", "sam.", "dim."];

function HeatGrid({ cells }: { cells: Statistics["heatmap"] }) {
  const max = Math.max(1, ...cells.map((cell) => cell.value));
  // 24 cases et la colonne des jours tiennent dans la carte (491 points utiles).
  const size = 16;
  const gap = 2;
  const valueAt = (weekday: number, hour: number) =>
    cells.find((cell) => cell.weekday === weekday && cell.hour === hour)
      ?.value ?? 0;
  return (
    <View>
      <View style={[styles.row, { marginLeft: 28 }]}>
        {Array.from({ length: 8 }, (_, index) => index * 3).map((hour) => (
          <Text
            key={hour}
            style={[styles.muted, { fontSize: 7, width: (size + gap) * 3 }]}
          >
            {hour}h
          </Text>
        ))}
      </View>
      {WEEKDAYS.map((weekday, row) => (
        <View
          key={weekday}
          style={[styles.row, { alignItems: "center", marginTop: gap }]}
        >
          <Text style={[styles.muted, { fontSize: 7, width: 28 }]}>
            {weekday}
          </Text>
          <Svg width={(size + gap) * 24} height={size}>
            {Array.from({ length: 24 }, (_, hour) => hour).map((hour) => {
              const value = valueAt(row + 1, hour);
              const level =
                value === 0 ? 0 : Math.min(5, Math.ceil((value / max) * 5));
              return (
                <Rect
                  key={hour}
                  x={hour * (size + gap)}
                  y={0}
                  width={size}
                  height={size}
                  rx={2}
                  fill={HEAT[level]}
                />
              );
            })}
          </Svg>
        </View>
      ))}
      <View style={[styles.row, { alignItems: "center", marginTop: 6 }]}>
        <Text style={[styles.muted, { fontSize: 7, marginRight: 4 }]}>
          Moins
        </Text>
        {HEAT.map((color) => (
          <View
            key={color}
            style={{
              width: 8,
              height: 8,
              borderRadius: 1.5,
              backgroundColor: color,
              marginRight: 2,
            }}
          />
        ))}
        <Text style={[styles.muted, { fontSize: 7, marginLeft: 2 }]}>Plus</Text>
      </View>
    </View>
  );
}

function SimpleTable({
  head,
  rows,
  widths,
}: {
  head: string[];
  rows: (string | number)[][];
  widths: number[];
}) {
  return (
    <View>
      <View
        style={[
          styles.row,
          { borderBottomWidth: 1, borderBottomColor: BORDER, paddingBottom: 4 },
        ]}
      >
        {head.map((label, index) => (
          <Text key={label} style={[styles.th, { width: `${widths[index]}%` }]}>
            {label}
          </Text>
        ))}
      </View>
      {rows.map((row) => (
        <View
          key={String(row[0])}
          wrap={false}
          style={[
            styles.row,
            { borderBottomWidth: 0.5, borderBottomColor: BORDER },
          ]}
        >
          {row.map((cell, index) => (
            <Text
              // biome-ignore lint/suspicious/noArrayIndexKey: les colonnes suivent l'en-tête.
              key={index}
              style={[styles.cell, { width: `${widths[index]}%` }]}
            >
              {typeof cell === "number" ? fmt(cell) : cell}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}

function Footer() {
  return (
    <View style={styles.footer} fixed>
      <Text>{"<br/>"} · Rapport d'activité</Text>
      <Text
        render={({ pageNumber, totalPages }) =>
          `Page ${pageNumber} sur ${totalPages}`
        }
      />
    </View>
  );
}

export function Report({
  data,
  author,
  generatedAt,
}: {
  data: Statistics;
  author: string;
  generatedAt: Date;
}) {
  const first = data.timeline[0]?.date ?? "";
  const last = data.timeline.at(-1)?.date ?? "";
  const statuses = (wanted: string[]) =>
    data.orderStatuses
      .filter((row) => wanted.includes(row.status))
      .reduce((sum, row) => sum + row.value, 0);
  const outcomes = [
    { label: "Terminées", value: statuses(["done"]), color: STATUS.good },
    {
      label: "En cours ou en attente",
      value: statuses(["pending", "running"]),
      color: STATUS.warning,
    },
    { label: "Arrêtées", value: statuses(["stopped"]), color: STATUS.serious },
    { label: "Échouées", value: statuses(["failed"]), color: STATUS.critical },
  ];
  const outcomeTotal = outcomes.reduce((sum, part) => sum + part.value, 0);
  const figures: [string, keyof Statistics["current"]][] = [
    ["Nouveaux comptes", "newUsers"],
    ["Membres actifs", "activeMembers"],
    ["Messages", "messages"],
    ["Commandes du cuisinier", "orders"],
    ["Appels d'IA", "aiCalls"],
    ["Crédits consommés", "credits"],
  ];

  return (
    <Document
      title={`Rapport d'activité <br/> · ${longDate(first)} au ${longDate(last)}`}
      author={author}
      creator="<br/> · tableau de bord"
      language="fr-FR"
    >
      <Page size="A4" style={styles.page}>
        <View
          style={[
            styles.row,
            { justifyContent: "space-between", alignItems: "center" },
          ]}
        >
          <Text style={styles.brand}>{"<br/>"}</Text>
          <Text style={styles.muted}>Retour à la ligne</Text>
        </View>
        <Text style={styles.title}>Rapport d'activité</Text>
        <Text style={[styles.muted, { marginTop: 4, fontSize: 10 }]}>
          Du {longDate(first)} au {longDate(last)} ({data.days} jours), comparé
          aux {data.days} jours précédents
        </Text>
        <Text style={[styles.muted, { marginTop: 2 }]}>
          Généré le{" "}
          {generatedAt.toLocaleString("fr-FR", {
            dateStyle: "long",
            timeStyle: "short",
          })}{" "}
          par {author} · fuseau {data.timeZone}
        </Text>

        <Text style={styles.section}>Chiffres clés</Text>
        <View style={[styles.row, { flexWrap: "wrap", marginHorizontal: -4 }]}>
          {figures.map(([label, key]) => (
            <View key={key} style={{ width: "33.33%", padding: 4 }}>
              <View style={[styles.card, { marginBottom: 0 }]}>
                <Text style={styles.muted}>{label}</Text>
                <Text
                  style={{
                    fontFamily: "Helvetica-Bold",
                    fontSize: 18,
                    marginTop: 4,
                  }}
                >
                  {fmt(data.current[key])}
                </Text>
                <Text style={[styles.muted, { marginTop: 3, fontSize: 8 }]}>
                  {change(data.current[key], data.previous[key])} · avant :{" "}
                  {fmt(data.previous[key])}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.section}>Activité</Text>
        <View style={styles.card} wrap={false}>
          <Text style={styles.cardTitle}>Messages par jour</Text>
          <Legend
            items={[
              { label: "Membres", color: SERIES[0] },
              { label: "Serveur", color: SERIES[1] },
              { label: "Cuisinier", color: SERIES[2] },
            ]}
          />
          <Columns
            data={data.timeline}
            keys={["members", "serveur", "cuisinier"]}
            colors={SERIES}
          />
        </View>
        <View style={styles.card} wrap={false}>
          <Text style={styles.cardTitle}>Issue des commandes</Text>
          {outcomeTotal === 0 ? (
            <Text style={[styles.muted, { marginTop: 4 }]}>
              Aucune commande sur la période.
            </Text>
          ) : (
            <>
              <View style={[styles.row, { height: 16, marginTop: 6 }]}>
                {outcomes
                  .filter((part) => part.value > 0)
                  .map((part) => (
                    <View
                      key={part.label}
                      style={{
                        width: `${(part.value / outcomeTotal) * 100}%`,
                        backgroundColor: part.color,
                        borderRightWidth: 1.5,
                        borderRightColor: "#ffffff",
                      }}
                    />
                  ))}
              </View>
              <Legend
                items={outcomes.map((part) => ({
                  label: `${part.label} : ${fmt(part.value)} (${Math.round((part.value / outcomeTotal) * 100)} %)`,
                  color: part.color,
                }))}
              />
            </>
          )}
        </View>
        <Footer />
      </Page>

      <Page size="A4" style={styles.page}>
        <View style={styles.card} wrap={false}>
          <Text style={styles.cardTitle}>Heures de pointe</Text>
          <Text style={[styles.muted, { marginBottom: 8 }]}>
            Messages des membres, par jour de la semaine et par heure
          </Text>
          <HeatGrid cells={data.heatmap} />
        </View>

        <Text style={styles.section}>Croissance</Text>
        <View style={styles.row}>
          <View style={[styles.card, { width: "49%", marginRight: "2%" }]}>
            <Text style={[styles.cardTitle, { marginBottom: 8 }]}>
              Nouveaux comptes par jour
            </Text>
            <Columns
              data={data.timeline}
              keys={["newUsers"]}
              colors={[SERIES[0] as string]}
              width={WIDTH / 2 - 60}
              height={75}
            />
          </View>
          <View style={[styles.card, { width: "49%" }]}>
            <Text style={[styles.cardTitle, { marginBottom: 8 }]}>
              Commandes du cuisinier par jour
            </Text>
            <Columns
              data={data.timeline}
              keys={["orders"]}
              colors={[SERIES[0] as string]}
              width={WIDTH / 2 - 60}
              height={75}
            />
          </View>
        </View>

        <Footer />
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={[styles.section, { marginTop: 0 }]}>
          Intelligence artificielle
        </Text>
        <View style={styles.card} wrap={false}>
          <Text style={styles.cardTitle}>Appels d'IA par jour</Text>
          <Legend
            items={[
              { label: "Réussis", color: SERIES[0] as string },
              { label: "Échoués", color: STATUS.critical },
            ]}
          />
          <Columns
            data={data.timeline}
            keys={["aiOk", "aiFailed"]}
            colors={[SERIES[0] as string, STATUS.critical]}
            height={80}
          />
        </View>
        <View style={styles.card} wrap={false}>
          <Text style={[styles.cardTitle, { marginBottom: 8 }]}>
            Crédits consommés par jour
          </Text>
          <AreaLine data={data.timeline} dataKey="credits" height={80} />
        </View>
        <Text style={styles.section}>Par fournisseur</Text>
        {data.providers.length === 0 ? (
          <Text style={styles.muted}>Aucun appel sur la période.</Text>
        ) : (
          <SimpleTable
            head={["Fournisseur", "Réussis", "Échoués", "Taux d'échec"]}
            widths={[40, 20, 20, 20]}
            rows={data.providers.map((provider) => {
              const total = provider.ok + provider.failed;
              return [
                provider.provider,
                provider.ok,
                provider.failed,
                `${total ? Math.round((provider.failed / total) * 100) : 0} %`,
              ];
            })}
          />
        )}

        <Text style={styles.section}>Équipes les plus actives</Text>
        {data.topTeams.length === 0 ? (
          <Text style={styles.muted}>Aucune activité sur la période.</Text>
        ) : (
          <SimpleTable
            head={["Équipe", "Messages", "Commandes", "Crédits"]}
            widths={[40, 20, 20, 20]}
            rows={data.topTeams.map((team) => [
              team.name,
              team.messages,
              team.orders,
              team.credits,
            ])}
          />
        )}

        <Text style={[styles.section, { marginTop: 0 }]} break>
          Détail jour par jour
        </Text>
        <SimpleTable
          head={[
            "Jour",
            "Membres",
            "Serveur",
            "Cuisinier",
            "Comptes",
            "Commandes",
            "IA réussis",
            "IA échoués",
            "Crédits",
          ]}
          widths={[16, 10, 10, 10, 10, 11, 11, 11, 11]}
          rows={data.timeline.map((point) => [
            dayLabel(point.date),
            point.members,
            point.serveur,
            point.cuisinier,
            point.newUsers,
            point.orders,
            point.aiOk,
            point.aiFailed,
            point.credits,
          ])}
        />
        <Footer />
      </Page>
    </Document>
  );
}

/** Construit le rapport et le télécharge sous le nom rapport-activite-AAAA-MM-JJ-30j.pdf. */
export async function downloadReport(
  data: Statistics,
  author: string,
): Promise<void> {
  const blob = await pdf(
    <Report data={data} author={author} generatedAt={new Date()} />,
  ).toBlob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `rapport-activite-${data.timeline.at(-1)?.date ?? "periode"}-${data.days}j.pdf`;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
