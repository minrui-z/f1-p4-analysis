#!/usr/bin/env Rscript

suppressPackageStartupMessages(library(lme4))
suppressPackageStartupMessages(library(jsonlite))

site <- normalizePath(file.path(dirname(sub("^--file=", "", grep("^--file=", commandArgs(), value = TRUE)[1])), ".."))
root <- normalizePath(file.path(site, ".."))
raw <- read.csv(file.path(root, "data", "f1_driver_race_2018_onward.csv"), na.strings = c("", "NA"))
result <- file.path(root, "results", "p4")
model <- readRDS(file.path(result, "full_simplified_2.rds"))
model_rows <- as.integer(rownames(model.frame(model)))
model_raw <- raw[model_rows, , drop = FALSE]

started <- raw[!raw$race_status %in% c("Did not start", "Did not qualify", "Did not prequalify"), , drop = FALSE]
driver_ids <- sort(unique(as.character(model.frame(model)$driver_ref)))
random <- read.csv(file.path(result, "full_simplified_2_random_effects.csv"))
driver_random <- random[random$group == "driver_ref", ]
drivers <- do.call(rbind, lapply(driver_ids, function(id) {
  all_rows <- started[started$driver_ref == id, , drop = FALSE]
  sample_rows <- model_raw[model_raw$driver_ref == id, , drop = FALSE]
  label <- paste(all_rows$driver_first_name[1], all_rows$driver_last_name[1])
  data.frame(id = id, name = label,
             starts = nrow(all_rows), p4 = sum(all_rows$finish_position == 4, na.rm = TRUE),
             rate = sum(all_rows$finish_position == 4, na.rm = TRUE) / nrow(all_rows),
             model_starts = nrow(sample_rows),
             model_p4 = sum(sample_rows$finish_position == 4, na.rm = TRUE),
             driver_effect = driver_random$random_intercept[match(id, driver_random$level)])
}))

coef <- read.csv(file.path(result, "full_simplified_2_fixed_effects.csv"), check.names = FALSE)
coef$or <- exp(coef$Estimate)
coef$lower <- exp(coef$Estimate - 1.96 * coef[["Std. Error"]])
coef$upper <- exp(coef$Estimate + 1.96 * coef[["Std. Error"]])
names(coef) <- c("term", "estimate", "se", "z", "p", "or", "lower", "upper")

payload <- list(
  meta = list(title = "第四名：2018 年起的 F1 正賽資料", year_start = min(raw$year),
              year_end = max(raw$year), last_race_date = as.character(max(as.Date(raw$race_date))),
              driver_count = length(driver_ids),
              model_n = nobs(model), model_races = length(unique(model_raw$race_id)),
              model_p4 = sum(model_raw$finish_position == 4, na.rm = TRUE)),
  drivers = drivers,
  coefficients = coef,
  sample_flow = read.csv(file.path(result, "sample_flow.csv")),
  diagnostics = read.csv(file.path(result, "frequentist_diagnostics.csv")),
  random_variances = read.csv(file.path(result, "full_simplified_2_random_variances.csv")),
  scaling = read.csv(file.path(result, "scaling.csv")),
  leclerc = read.csv(file.path(result, "leclerc_significance.csv")),
  coverage = read.csv(file.path(root, "docs", "coverage_by_year.csv"))
)
dir.create(file.path(site, "data"), showWarnings = FALSE)
write_json(payload, file.path(site, "data", "results.json"), auto_unbox = TRUE,
           pretty = TRUE, digits = 12, na = "null")
cat("Exported", length(driver_ids), "drivers and", nobs(model), "model observations\n")
