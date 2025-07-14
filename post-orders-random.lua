-- Fixed list of valid customer IDs
local customer_ids = {
  "ALFKI", "ANATR", "ANTON", "AROUT", "BERGS", "BLAUS", "BLONP", "BOLID",
  "BONAP", "BOTTM", "BSBEV", "CACTU", "CENTC", "CHOPS", "COMMI", "CONSH",
  "DRACD", "DUMON", "EASTC", "ERNSH", "FAMIA", "FISSA", "FOLIG", "FOLKO",
  "FRANK", "FRANR", "FRANS", "FURIB", "GALED", "GODOS", "GOURL", "GREAL",
  "GROSR", "HANAR", "HILAA", "HUNGC", "HUNGO", "ISLAT", "KOENE", "LACOR",
  "LAMAI", "LAUGB", "LAZYK", "LEHMS", "LETSS", "LILAS", "LINOD", "LONEP",
  "MAGAA", "MAISD", "MEREP", "MORGK", "NORTS", "OCEAN", "OLDWO", "OTTIK",
  "PARIS", "PERIC", "PICCO", "PRINI", "QUEDE", "QUEEN", "QUICK", "RANCH",
  "RATTC", "REGGC", "RICAR", "RICSU", "ROMEY", "SANTG", "SAVEA", "SEVES",
  "SIMOB", "SPECD", "SPLIR", "SUPRD", "THEBI", "THECR", "TOMSP", "TORTU",
  "TRADH", "TRAIH", "VAFFE", "VICTE", "VINET", "WANDK", "WARTH", "WELLI",
  "WHITC", "WILMK", "WOLZA"
}

-- Set method and headers once
wrk.method = "POST"
wrk.headers["Content-Type"] = "application/json"

-- Generate a new body for every request
request = function()
  local customer_id = customer_ids[math.random(#customer_ids)]
  local total = string.format("%.2f", math.random() * 990 + 10) -- 10.00 to 999.99
  local body = string.format('{"customer_id":"%s","total":%s}', customer_id, total)
  return wrk.format(nil, nil, nil, body)
end