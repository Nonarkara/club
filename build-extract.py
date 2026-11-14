#!/usr/bin/env python3
"""Rebuild from the original CL;UB catalogue with its pinned Bangkok Overture parquet."""
import json
import pathlib
import re
import sys
from collections import Counter
import duckdb

source = json.loads(pathlib.Path(sys.argv[1]).read_text())
with duckdb.connect() as db:
    categories = dict(
        (key, (basic or '', taxonomy or ''))
        for key, basic, taxonomy in db.execute(
            """
            SELECT 'o' || substr(replace(id, '-', ''), 1, 12), basic_category, taxonomy.primary
            FROM read_parquet(?) WHERE taxonomy.primary IN ('cannabis_clinic','cannabis_dispensary')
                                     OR basic_category IN ('cannabis_clinic','cannabis_dispensary')
            """, [sys.argv[2]]
        ).fetchall()
    )

signal = re.compile(r'cannabis|canabis|dispensary|\bweed\b|ganja|\bthc\b|กัญชา', re.I)
store = re.compile(r'dispensary|cannabis shop|weed shop|ร้านกัญชา', re.I)
clinic = re.compile(r'\bclinic\b|คลินิก|เวชกรรม', re.I)
cafe = re.compile(r'caf[eé]|coffee|คาเฟ่', re.I)
places = []
for key, name, _, lat, lng, *_ in source['rows']:
    detail = source['details'][key]
    thai = detail.get('th', '')
    label = name + ' ' + thai
    if key.startswith('o'):
        basic, tax = categories.get(key, ('', ''))
        # The raw clinic category is noisy. Require explicit supporting names
        # for every clinic and never classify a storefront name as a clinic.
        if not signal.search(label):
            continue
        if clinic.search(label) and not store.search(label):
            kind = 'clinic'
        elif cafe.search(label) and not store.search(label):
            kind = 'cafe'
        elif store.search(label) or 'cannabis_dispensary' in (basic, tax):
            kind = 'dispensary'
        else:
            kind = 'other'
    else:
        # The upstream OSM pass requires a cannabis/dispensary tag or names.
        kind = detail['sub']
    places.append([key, name, lat, lng, kind, thai])
assert len({p[0] for p in places}) == len(places)
print(Counter(p[4] for p in places), file=sys.stderr)
print(json.dumps({'sources':source['builtFrom'], 'places':places}, ensure_ascii=False, separators=(',', ':')))
