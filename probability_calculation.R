# Read in landslide inventory data from Google sheets
# Generate prediction intervals from data
# Find the prediction interval that matches to the input volume and H/L
# Prediction interval returned corresponds to the probability of the runout reaching or exceeding the input H/L
#
# 27 July 2016 - AM
######################################################################################################################

# function to find the prediction interval for a subset of the landslide database
# input Volume in Mm3 (Vol), H/L ratio (HL), and the dataset to use ("Scheidegger", "Li", "Corominas", "Canadian" or "all") 
if (!require("gsheet")) {
  install.packages("gsheet", repos="https://cran.r-project.org/") 
  library("gsheet")
}

regress <- function(Vol, HL, dataset) {
  # call in data from google docs to the workspace
  require(gsheet)
  all.data = gsheet2tbl("docs.google.com/spreadsheets/d/1fMqlQs5P2FXA5KSP8HpOrYLT7L3mxUZgn5vl8a1tqKM/edit?usp=sharing")
  # make a subset of the data based on the input 'dataset'
  if(dataset == "all") {
    data = all.data
  } else data = subset(all.data, Dataset == dataset)
  
  # create a linear relationship by log transforming volume (in Mm3) and keeping H/L 
  logV = log10(data$Volume..Mm3.)
  logHL = log10(data$H.L)
  
  loglm = lm(logHL ~ logV)
  
  # calculate the initial error to determine if we are the upper or lower prediction interval should be used
  test.level = 0.5
  init.error = 10^predict.lm(loglm, new = data.frame(logV = log10(Vol)), interval = "prediction", level = test.level)[1] - HL
  
  # iteratively check the level to determine until the error is minimized.
  # initial data storage
  levels = seq(0.51, 0.99, 0.01)
  check = numeric(length(levels))
  
  if(init.error < 0) {
    for(i in 1:length(levels)) {
      check[i] = 10^predict.lm(loglm, new = data.frame(logV = log10(Vol)), interval = "prediction", level = levels[i])[3] - HL
    }
    PI = levels[which(abs(check) == min(abs(check)))]
  } else {
    for(i in 1:length(levels)) {
      check[i] = 10^predict.lm(loglm, new = data.frame(logV = log10(Vol)), interval = "prediction", level = levels[i])[2] - HL
    }
    PI = 1 - levels[which(abs(check) == min(abs(check)))]
    }

return(PI)  
}

args <- commandArgs(trailingOnly = TRUE)
cat(regress(as.numeric(args[1]), as.numeric(args[2]), args[3]))

