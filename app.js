import { createClient } from "https://esm.sh/@supabase/supabase-js";

const supabase = createClient(
  "https://kwprfihsojppxdcjorao.supabase.co",
  "sb_publishable_R-TEDDTib8JxWswA3x_lHg_NBdUwvjm"
);

console.log("Supabase connecté !");
