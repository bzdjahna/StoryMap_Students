library(sf)        # Para manipular datos vectoriales
library(tidyverse) # Para ciencia datos
library(geojsonsf) # sf a geojson
library(geojsonio) # guardar un geojson de acuerdo al tipo de geometria

# Preprocessing data of points
path_pto <- "data/raw/StoryMap_Huamanga.xlsx"
data <- readxl::read_xlsx(path_pto) |> 
  janitor::clean_names() |>
  select(-c(id,x2,zoom, image)) |> 
  rename(id = chapter, text = description, image = source_link) |> 
  select(id,image,text, lon, lat,title,nro) |> 
  st_as_sf(coords = c("lon","lat"), crs = 4326) |> 
  geojsonsf::sf_geojson()

geojson_write(input = data,file = "data/processed/storymap_ptos.geojson")

# Preprocessing data of lines 
path_line <- "data/raw/0_rutas_estudiantes.shp"
data <- st_read(path_line) |> 
  sf_geojson()

geojson_write(
  input = data,
  file = "data/processed/storymap_lines.geojson",
  geometry = "linestring")