# CL;UB · Bangkok directory

The public, static CL;UB directory for GitHub Pages. The PL;UB work map and its API, notebooks and credentials are not part of this repository.

Run `python3 -m http.server 8080` in this directory to preview. The publishing branch is `gh-pages` at repository root. Custom domain: `club.nonarkara.org`, via a DNS-only CNAME to `nonarkara.github.io`.

## Sources

`places.json` is an extract of CL;UB source commit `d904325` (private PL;UB repository): ID, name, latitude, longitude source-derived subtype and an optional Thai alias. To rebuild, run `python3 build-extract.py <original-catalogue.json> <pinned-bangkok-overture.parquet>` with DuckDB installed. Overture rows require a cannabis-related name and clinics require additional clinic wording; conflicting retail names are classified as retail. The extract excludes ambiguous rows. Coordinates are reproduced without geocoding or rounding again. Identifiers prefixed `n`, `w`, and `r` refer to OpenStreetMap features; `o` identifiers are locally shortened Overture identifiers. Some subtype labels use name matching; classifications are not verified licenses.

- © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright), data under ODbL 1.0, snapshot 24 October 2026. The OpenStreetMap-derived database extract is available in `places.json` and can be selected by the `n`, `w`, or `r` ID prefix.
- [Overture Maps Places attribution](https://docs.overturemaps.org/attribution/), release 2026-10-21.0, under CDLA-Permissive 2.0.
- Basemap: OpenFreeMap / OpenMapTiles / OpenStreetMap. On-map attribution comes from the basemap. MapLibre, Jost and Prompt licenses are included.
