---
title: Diabetes Risk Dashboard
description: A Gradio app that turns a trained random forest into a risk estimate a person can read — with the cohort's limits printed next to it.
pubDate: 2026-04-24
category: personal
stack: [Python, scikit-learn, pandas, Gradio, Hugging Face Spaces]
status: live
order: 10
repoUrl: https://github.com/naimul3103/diabetes-prediction-system
demoUrl: https://naimul3103-diabetes-prediction-system-for-women.hf.space
outcomes:
  - claim: Held-out test accuracy on a stratified 20% split.
    metric: "0.7597 accuracy"
    method: "train_test_split(test_size=0.2, random_state=42, stratify=y); scored once on the hold-out set"
  - claim: Ranking quality on the same hold-out set, which matters more than accuracy for a screening tool.
    metric: "0.8311 ROC-AUC"
    method: "roc_auc_score on the untouched 20% hold-out"
  - claim: Cross-validated AUC stayed close to the hold-out score, so the result is not a lucky split.
    metric: "0.8446 CV ROC-AUC"
    method: "GridSearchCV with StratifiedKFold(5), scoring='roc_auc', imputation inside the pipeline"
evidence:
  - https://github.com/naimul3103/diabetes-prediction-system/blob/main/final_solution_pkl.py
  - https://github.com/naimul3103/diabetes-prediction-system/blob/main/app.py
  - https://huggingface.co/spaces/naimul3103/diabetes-prediction-system-for-women
whatIdDoDifferently: >-
  I would ship the dataset with a download script and a pinned hash, add a test
  that loads the pickle and asserts the three stored metrics, and replace the
  committed certificate file with a documented Space secret. The README also
  names the wrong training script — that is the kind of small lie that makes a
  reviewer distrust the big numbers.
---

## The problem

A model that lives in a notebook is a claim. I wanted the other thing: an
interface where someone enters the measurements and gets a number back, with
the model's real accuracy visible on the same screen.

The dataset is the Pima Indians Diabetes Database — 768 rows, eight clinical
features, a binary outcome. It is small, old, and has a well-known selection
bias. I picked it because the constraints were honest, not because the score
would look good.

## What I built

A pipeline that keeps preprocessing inside cross-validation, so the reported
score is not inflated by leakage:
1. Zeros in `Glucose`, `BloodPressure`, `SkinThickness`, `Insulin` and `BMI`
   are treated as missing, not as real measurements.
2. Outliers are clipped with an IQR rule.
3. Two features are engineered — a BMI category and a glucose/insulin ratio.
4. `SimpleImputer(median) → StandardScaler → RandomForestClassifier` runs as one
   pipeline inside `GridSearchCV`.
5. The winning pipeline is pickled together with its test metrics, and the
   Gradio app reads those metrics at start-up rather than hard-coding them.

That last decision is the one I am happiest with: the interface cannot claim a
score the model file does not contain.

## Results, and what they mean

| Metric        | Value  | Where it comes from                     |
| ------------- | ------ | --------------------------------------- |
| Test accuracy | 0.7597 | stratified 20% hold-out, one pass       |
| Test ROC-AUC  | 0.8311 | same hold-out                           |
| CV ROC-AUC    | 0.8446 | 5-fold stratified, tuned by grid search |

The gap between CV and hold-out is small enough that I believe the number. The
number itself is still modest — and that is the useful part. A 0.83 AUC on a
768-row cohort does not transfer to a hospital, and the app says so.

## Limits I would not remove from the page

- The cohort is women of Pima heritage aged 21 and over. The model is not
  validated outside that population.
- No calibration curve. A predicted probability is not a clinical risk.
- The Space runs on free CPU; the first request after idle is slow.

## Stack

Python, pandas, NumPy, scikit-learn, Gradio, Hugging Face Spaces.
