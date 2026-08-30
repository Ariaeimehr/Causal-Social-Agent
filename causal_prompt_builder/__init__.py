"""
Causal Prompt Builder Module
=============================
Transforms empirical agent interaction logs, temporal sentiment shifts,
and psychometric trait matrices into formal causal discovery prompts
grounded in Pearl's Structural Causal Models (SCM) and do-calculus.
"""

from .log_extractor import InteractionLogExtractor, ExtractedCausalFeatures
from .prompt_templates import SCMPromptTemplate, CausalPromptFormat
from .builder import CausalPromptBuilder

__all__ = [
    "InteractionLogExtractor",
    "ExtractedCausalFeatures",
    "SCMPromptTemplate",
    "CausalPromptFormat",
    "CausalPromptBuilder",
]
