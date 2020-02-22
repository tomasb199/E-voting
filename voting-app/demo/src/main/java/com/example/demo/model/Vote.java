package com.example.demo.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class Vote {
    private Candidate[] candidate;
    private int voteType;
    @JsonProperty("Sign")
    private String Sign;
    private String id;
}
